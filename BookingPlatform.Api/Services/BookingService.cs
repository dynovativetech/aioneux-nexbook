using System.Data;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public class BookingService : IBookingService
    {
        // ── Constants ────────────────────────────────────────────────────────
        private static readonly int[] AllowedSlotDurations = { 15, 30, 45, 60, 90, 120 };

        /// <summary>
        /// Tolerance for client/server clock skew when comparing StartTime to "now".
        /// A booking may start up to this many seconds in the past and still be accepted.
        /// </summary>
        private const int PastToleranceSeconds = 60;

        private readonly AppDbContext          _context;
        private readonly IAuditService         _audit;
        private readonly ITenantContext        _tenantContext;
        private readonly INotificationService  _notifications;

        public BookingService(
            AppDbContext context,
            IAuditService audit,
            ITenantContext tenantContext,
            INotificationService notifications)
        {
            _context       = context;
            _audit         = audit;
            _tenantContext = tenantContext;
            _notifications = notifications;
        }

        // ════════════════════════════════════════════════════════════════════
        // Query
        // ════════════════════════════════════════════════════════════════════

        public async Task<ApiResponse<List<BookingResponse>>> GetAllAsync()
        {
            var bookings = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Facility)
                .Include(b => b.Activity)
                .Include(b => b.Instructor)
                .Include(b => b.Participants)
                .Include(b => b.FacilityReservations)
                .Include(b => b.InstructorReservations).ThenInclude(r => r.Instructor)
                .AsNoTracking()
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<BookingResponse>>.Ok(
                bookings.Select(MapToResponse).ToList());
        }

        public async Task<ApiResponse<BookingResponse>> GetByIdAsync(int id)
        {
            var booking = await FindWithNavigationsAsync(id);
            if (booking is null)
                return ApiResponse<BookingResponse>.NotFound($"Booking #{id} not found.");

            return ApiResponse<BookingResponse>.Ok(MapToResponse(booking));
        }

        // ════════════════════════════════════════════════════════════════════
        // Creation — public entry points
        // ════════════════════════════════════════════════════════════════════

        /// <summary>Single-person, single-slot booking.</summary>
        public async Task<ApiResponse<BookingResponse>> CreateSingleBookingAsync(CreateBookingRequest req)
        {
            NormaliseParticipantCount(req);

            var errors = await ValidateCommonAsync(
                req.UserId, req.FacilityId, req.ActivityId, req.InstructorId, req.ParticipantCount);
            errors.AddRange(ValidateTimeWindow(req.StartTime, req.EndTime));
            if (errors.Count > 0)
                return ApiResponse<BookingResponse>.Fail("Validation failed.", errors);

            var slots = SingleSlot(req.StartTime, req.EndTime);
            return await CreateTransactionalAsync(
                req.UserId, req.FacilityId, req.ActivityId, req.InstructorId,
                BookingType.Single, slots, req.ParticipantCount, req.Notes, req.Participants,
                auditSuffix: $"facility #{req.FacilityId}, {req.StartTime:dd MMM HH:mm}–{req.EndTime:HH:mm}");
        }

        /// <summary>
        /// Group booking — multiple participants, one slot.
        /// Named attendees are stored in BookingParticipant rows.
        /// </summary>
        public async Task<ApiResponse<BookingResponse>> CreateGroupBookingAsync(CreateGroupBookingRequest req)
        {
            // Derive count from participant list when the caller relies on the list
            if (req.Participants.Count > req.ParticipantCount)
                req.ParticipantCount = req.Participants.Count;

            var errors = await ValidateCommonAsync(
                req.UserId, req.FacilityId, req.ActivityId, req.InstructorId, req.ParticipantCount);
            errors.AddRange(ValidateTimeWindow(req.StartTime, req.EndTime));

            if (req.ParticipantCount < 2)
                errors.Add("Group bookings must have at least 2 participants.");

            if (errors.Count > 0)
                return ApiResponse<BookingResponse>.Fail("Validation failed.", errors);

            var slots = SingleSlot(req.StartTime, req.EndTime);
            return await CreateTransactionalAsync(
                req.UserId, req.FacilityId, req.ActivityId, req.InstructorId,
                BookingType.Group, slots, req.ParticipantCount, req.Notes, req.Participants,
                auditSuffix: $"{req.ParticipantCount} participants, facility #{req.FacilityId}, {req.StartTime:dd MMM HH:mm}–{req.EndTime:HH:mm}");
        }

        /// <summary>
        /// Multi-slot booking — one parent Booking, multiple reservation rows.
        ///
        /// How multi-slot is handled:
        ///   ONE Booking (BookingType = MultiSlot) is the parent aggregate.
        ///   Each element in <c>Slots</c> becomes one FacilityReservation and,
        ///   when an instructor is requested, one InstructorReservation.
        ///
        ///   Pre-write validations performed:
        ///   1. Standard FK and capacity checks.
        ///   2. Every slot's time window is individually validated.
        ///   3. Within-request self-overlap: no two slots in the same request may overlap.
        ///
        ///   The actual conflict check against existing reservations and the DB write
        ///   are unified inside a single SERIALIZABLE transaction (see CreateTransactionalAsync),
        ///   preventing TOCTOU double-booking races.
        /// </summary>
        public async Task<ApiResponse<BookingResponse>> CreateMultiSlotBookingAsync(CreateMultiSlotBookingRequest req)
        {
            if (req.Slots is null || req.Slots.Count < 2)
                return ApiResponse<BookingResponse>.Fail("Multi-slot bookings require at least 2 slots.");

            NormaliseParticipantCount(req);

            var errors = await ValidateCommonAsync(
                req.UserId, req.FacilityId, req.ActivityId, req.InstructorId, req.ParticipantCount);

            foreach (var slot in req.Slots)
                errors.AddRange(
                    ValidateTimeWindow(slot.StartTime, slot.EndTime,
                        tag: slot.StartTime.ToString("dd MMM HH:mm")));

            // Self-overlap: two slots in the same request must not overlap each other.
            errors.AddRange(CheckIntraSlotOverlaps(req.Slots));

            if (errors.Count > 0)
                return ApiResponse<BookingResponse>.Fail("Validation failed.", errors);

            return await CreateTransactionalAsync(
                req.UserId, req.FacilityId, req.ActivityId, req.InstructorId,
                BookingType.MultiSlot, req.Slots, req.ParticipantCount, req.Notes, req.Participants,
                auditSuffix: $"{req.Slots.Count} slots, facility #{req.FacilityId}");
        }

        /// <summary>Backward-compatible alias — delegates to CreateSingleBookingAsync.</summary>
        public Task<ApiResponse<BookingResponse>> CreateAsync(CreateBookingRequest request)
            => CreateSingleBookingAsync(request);

        // ════════════════════════════════════════════════════════════════════
        // Creation — shared transactional core
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Performs the authoritative conflict check and the DB write inside a single
        /// SERIALIZABLE transaction, eliminating the TOCTOU race condition that would
        /// occur if the check and the write were in separate transactions.
        ///
        /// Why SERIALIZABLE?
        ///   Under SQL Server's default READ COMMITTED isolation, two concurrent requests
        ///   can both read "no overlap" at the same instant, both pass the check, and both
        ///   write overlapping rows.  SERIALIZABLE causes SQL Server to hold range locks on
        ///   the scanned rows/pages, blocking a concurrent insert until this transaction
        ///   commits or rolls back — preventing the double-booking race.
        ///
        /// DbUpdateException catch:
        ///   A DB-level constraint violation (e.g. a race that still slips through) is
        ///   caught and returned as a Conflict ApiResponse instead of a 500.
        /// </summary>
        private async Task<ApiResponse<BookingResponse>> CreateTransactionalAsync(
            int userId, int facilityId, int activityId, int? instructorId,
            BookingType bookingType, List<TimeSlotRequest> slots,
            int participantCount, string? notes, List<BookingParticipantDto>? participants,
            string auditSuffix = "")
        {
            await using var tx = await _context.Database
                .BeginTransactionAsync(IsolationLevel.Serializable);

            try
            {
                // Authoritative conflict check — inside the serializable transaction.
                var conflicts = await CheckSlotConflictsAsync(facilityId, instructorId, slots);
                if (conflicts.Count > 0)
                {
                    await tx.RollbackAsync();
                    return ApiResponse<BookingResponse>.Conflict(
                        "Booking conflict detected.", conflicts);
                }

                // Check whether the facility requires manual approval.
                // If RequiresApproval = false, we auto-confirm immediately.
                var requiresApproval = await _context.Facilities
                    .Where(f => f.Id == facilityId)
                    .Select(f => f.RequiresApproval)
                    .FirstOrDefaultAsync();

                var booking = BuildBookingAggregate(
                    _tenantContext.TenantId ?? 1,
                    userId, facilityId, activityId, instructorId,
                    bookingType, slots, participantCount, notes, participants);

                // Auto-confirm when facility allows it — no organizer action needed.
                if (!requiresApproval)
                {
                    booking.Status = BookingStatus.Confirmed;
                    foreach (var r in booking.FacilityReservations)   r.Status = ReservationStatus.Confirmed;
                    foreach (var r in booking.InstructorReservations)  r.Status = ReservationStatus.Confirmed;
                }

                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                await _audit.LogAsync("Create", "Booking", booking.Id, $"Booking #{booking.Id}",
                    $"{bookingType} booking created: {auditSuffix}. " +
                    $"Status: {(requiresApproval ? "Pending approval" : "Auto-confirmed")}.");

                // Fire notification after commit — catch internally so booking response is unaffected.
                try { await _notifications.NotifyBookingCreatedAsync(booking.Id); }
                catch (Exception ex) { /* notification failure must not break the booking response */ _ = ex; }

                var saved = await FindWithNavigationsAsync(booking.Id);
                return ApiResponse<BookingResponse>.Ok(
                    MapToResponse(saved!),
                    $"{bookingType} booking {(requiresApproval ? "submitted for approval" : "confirmed")} successfully.");
            }
            catch (DbUpdateException ex)
            {
                // A rare concurrent race slipped past the serializable check,
                // or another DB constraint was violated.
                await tx.RollbackAsync();
                return ApiResponse<BookingResponse>.Conflict(
                    $"A concurrent conflict prevented the booking from being saved. " +
                    $"Please check availability and try again. ({ex.InnerException?.Message ?? ex.Message})");
            }
        }

        // ════════════════════════════════════════════════════════════════════
        // Mutation
        // ════════════════════════════════════════════════════════════════════

        public async Task<ApiResponse<BookingResponse>> UpdateAsync(int id, UpdateBookingRequest req)
        {
            var existing = await _context.Bookings
                .Include(b => b.FacilityReservations)
                .Include(b => b.InstructorReservations)
                .Include(b => b.Participants)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (existing is null)
                return ApiResponse<BookingResponse>.NotFound($"Booking #{id} not found.");

            if (existing.Status == BookingStatus.Cancelled)
                return ApiResponse<BookingResponse>.Fail("A cancelled booking cannot be updated.");

            if (existing.Status == BookingStatus.Completed)
                return ApiResponse<BookingResponse>.Fail("A completed booking cannot be updated.");

            // Guard: updating a multi-slot booking via the single-slot endpoint would replace
            // all reservation rows with just one, silently corrupting the booking.
            if (existing.BookingType == BookingType.MultiSlot)
                return ApiResponse<BookingResponse>.Fail(
                    "Multi-slot bookings cannot be updated via this endpoint. " +
                    "Cancel the booking and create a new one.");

            var errors = await ValidateCommonAsync(
                req.UserId, req.FacilityId, req.ActivityId, req.InstructorId, req.ParticipantCount);
            errors.AddRange(ValidateTimeWindow(req.StartTime, req.EndTime));
            if (errors.Count > 0)
                return ApiResponse<BookingResponse>.Fail("Validation failed.", errors);

            var slots = SingleSlot(req.StartTime, req.EndTime);

            await using var tx = await _context.Database
                .BeginTransactionAsync(IsolationLevel.Serializable);

            try
            {
                // Authoritative conflict check inside the serializable transaction,
                // excluding the current booking's own reservations from the check.
                var conflicts = await CheckSlotConflictsAsync(
                    req.FacilityId, req.InstructorId, slots, excludeBookingId: id);

                if (conflicts.Count > 0)
                {
                    await tx.RollbackAsync();
                    return ApiResponse<BookingResponse>.Conflict(
                        "Booking conflict detected.", conflicts);
                }

                // Apply changes only after the conflict check passes
                _context.FacilityReservations.RemoveRange(existing.FacilityReservations);
                _context.InstructorReservations.RemoveRange(existing.InstructorReservations);

                existing.UserId           = req.UserId;
                existing.FacilityId       = req.FacilityId;
                existing.ActivityId       = req.ActivityId;
                existing.InstructorId     = req.InstructorId;
                existing.StartTime        = req.StartTime;
                existing.EndTime          = req.EndTime;
                existing.ParticipantCount = req.ParticipantCount;
                existing.Notes            = req.Notes;
                existing.Status           = req.Status;
                existing.UpdatedAt        = DateTime.UtcNow;

                // Replace reservation rows — BookingId is set automatically by EF Core
                // via the navigation property; no need to set it explicitly.
                existing.FacilityReservations.Add(
                    BuildFacilityReservation(req.FacilityId, req.StartTime, req.EndTime));

                if (req.InstructorId.HasValue)
                    existing.InstructorReservations.Add(
                        BuildInstructorReservation(
                            req.InstructorId.Value, req.ActivityId, req.StartTime, req.EndTime));

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                await _audit.LogAsync("Update", "Booking", id, $"Booking #{id}",
                    $"Updated to facility #{req.FacilityId}, {req.StartTime:dd MMM HH:mm}–{req.EndTime:HH:mm}.");

                var updated = await FindWithNavigationsAsync(id);
                return ApiResponse<BookingResponse>.Ok(
                    MapToResponse(updated!), "Booking updated successfully.");
            }
            catch (DbUpdateException ex)
            {
                await tx.RollbackAsync();
                return ApiResponse<BookingResponse>.Conflict(
                    $"A concurrent conflict prevented the update. Please try again. " +
                    $"({ex.InnerException?.Message ?? ex.Message})");
            }
        }

        /// <summary>
        /// Cancels the booking and marks all child FacilityReservation and
        /// InstructorReservation rows as Cancelled, releasing those time slots.
        /// </summary>
        public async Task<ApiResponse<bool>> CancelBookingAsync(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.FacilityReservations)
                .Include(b => b.InstructorReservations)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking is null)
                return ApiResponse<bool>.NotFound($"Booking #{id} not found.");

            if (booking.Status == BookingStatus.Cancelled)
                return ApiResponse<bool>.Fail("Booking is already cancelled.");

            if (booking.Status == BookingStatus.Completed)
                return ApiResponse<bool>.Fail("A completed booking cannot be cancelled.");

            booking.Status    = BookingStatus.Cancelled;
            booking.UpdatedAt = DateTime.UtcNow;

            foreach (var fr in booking.FacilityReservations)
                fr.Status = ReservationStatus.Cancelled;

            foreach (var ir in booking.InstructorReservations)
                ir.Status = ReservationStatus.Cancelled;

            await _context.SaveChangesAsync();

            await _audit.LogAsync("Cancel", "Booking", id, $"Booking #{id}",
                $"Cancelled — {booking.FacilityReservations.Count} facility slot(s) and " +
                $"{booking.InstructorReservations.Count} instructor slot(s) released.");

            try { await _notifications.NotifyBookingCancelledAsync(id); }
            catch (Exception ex) { _ = ex; }

            return ApiResponse<bool>.Ok(true,
                "Booking cancelled and all reservations released.");
        }

        public Task<ApiResponse<bool>> CancelAsync(int id) => CancelBookingAsync(id);

        public async Task<ApiResponse<bool>> DeleteAsync(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking is null)
                return ApiResponse<bool>.NotFound($"Booking #{id} not found.");

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            await _audit.LogAsync("Delete", "Booking", id, $"Booking #{id}",
                $"Booking #{id} permanently deleted.");

            return ApiResponse<bool>.Ok(true, "Booking deleted successfully.");
        }

        // ════════════════════════════════════════════════════════════════════
        // Availability engine
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Returns available slots for a facility based on FacilityReservation records.
        ///
        /// Overlap test (Allen's interval criterion):
        ///   A slot [slotStart, slotEnd) is busy when ANY existing reservation satisfies:
        ///       reservationStart &lt; slotEnd  AND  reservationEnd &gt; slotStart
        ///   A slot is available when no such reservation exists.
        /// </summary>
        public async Task<ApiResponse<ResourceAvailabilityResponse>> GetAvailableFacilitySlotsAsync(
            FacilityAvailabilityRequest req)
        {
            var errors = ValidateAvailabilityParams(
                req.SlotDurationMinutes, req.OpenHour, req.CloseHour, req.Date);
            if (errors.Count > 0)
                return ApiResponse<ResourceAvailabilityResponse>.Fail("Invalid request.", errors);

            var facility = await _context.Facilities
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == req.FacilityId);

            if (facility is null)
                return ApiResponse<ResourceAvailabilityResponse>.NotFound(
                    $"Facility #{req.FacilityId} not found.");

            var (dayStart, dayEnd) = DayWindow(req.Date, req.OpenHour, req.CloseHour);

            var reserved = await _context.FacilityReservations
                .AsNoTracking()
                .Where(r =>
                    r.FacilityId == req.FacilityId &&
                    r.Status     != ReservationStatus.Cancelled &&
                    r.StartTime  <  dayEnd &&
                    r.EndTime    >  dayStart)
                .Select(r => new Interval(r.StartTime, r.EndTime))
                .ToListAsync();

            var result = GenerateAvailableSlots(
                dayStart, dayEnd, TimeSpan.FromMinutes(req.SlotDurationMinutes), reserved);

            return ApiResponse<ResourceAvailabilityResponse>.Ok(
                new ResourceAvailabilityResponse
                {
                    ResourceId          = facility.Id,
                    ResourceName        = facility.Name,
                    ResourceType        = "Facility",
                    Date                = dayStart.Date,
                    SlotDurationMinutes = req.SlotDurationMinutes,
                    TotalSlots          = result.Total,
                    AvailableSlotCount  = result.Slots.Count,
                    BookedSlotCount     = result.Total - result.Slots.Count,
                    AvailableSlots      = result.Slots,
                },
                $"{result.Slots.Count} slot(s) available for {facility.Name}.");
        }

        /// <summary>
        /// Returns available slots for an instructor based on InstructorReservation records.
        /// </summary>
        public async Task<ApiResponse<ResourceAvailabilityResponse>> GetAvailableInstructorSlotsAsync(
            InstructorAvailabilityRequest req)
        {
            var errors = ValidateAvailabilityParams(
                req.SlotDurationMinutes, req.OpenHour, req.CloseHour, req.Date);
            if (errors.Count > 0)
                return ApiResponse<ResourceAvailabilityResponse>.Fail("Invalid request.", errors);

            var instructor = await _context.Instructors
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == req.InstructorId);

            if (instructor is null)
                return ApiResponse<ResourceAvailabilityResponse>.NotFound(
                    $"Instructor #{req.InstructorId} not found.");

            var (dayStart, dayEnd) = DayWindow(req.Date, req.OpenHour, req.CloseHour);

            var reserved = await _context.InstructorReservations
                .AsNoTracking()
                .Where(r =>
                    r.InstructorId == req.InstructorId &&
                    r.Status       != ReservationStatus.Cancelled &&
                    r.StartTime    <  dayEnd &&
                    r.EndTime      >  dayStart)
                .Select(r => new Interval(r.StartTime, r.EndTime))
                .ToListAsync();

            var result = GenerateAvailableSlots(
                dayStart, dayEnd, TimeSpan.FromMinutes(req.SlotDurationMinutes), reserved);

            return ApiResponse<ResourceAvailabilityResponse>.Ok(
                new ResourceAvailabilityResponse
                {
                    ResourceId          = instructor.Id,
                    ResourceName        = instructor.Name,
                    ResourceType        = "Instructor",
                    Date                = dayStart.Date,
                    SlotDurationMinutes = req.SlotDurationMinutes,
                    TotalSlots          = result.Total,
                    AvailableSlotCount  = result.Slots.Count,
                    BookedSlotCount     = result.Total - result.Slots.Count,
                    AvailableSlots      = result.Slots,
                },
                $"{result.Slots.Count} slot(s) available for {instructor.Name}.");
        }

        // ════════════════════════════════════════════════════════════════════
        // Private helpers
        // ════════════════════════════════════════════════════════════════════

        // ── Validation ───────────────────────────────────────────────────────

        /// <summary>
        /// Validates FK references, participant capacity, and instructor qualification.
        /// Sequential DB queries are intentional — EF Core's DbContext is not thread-safe
        /// so Task.WhenAll across the same context is not safe.
        /// </summary>
        private async Task<List<string>> ValidateCommonAsync(
            int userId, int facilityId, int activityId, int? instructorId, int participantCount)
        {
            var errors = new List<string>();

            if (!await _context.Users.AnyAsync(u => u.Id == userId))
                errors.Add($"User #{userId} does not exist.");

            var facility = await _context.Facilities
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == facilityId);

            if (facility is null)
                errors.Add($"Facility #{facilityId} does not exist.");
            else if (participantCount > facility.Capacity)
                errors.Add(
                    $"ParticipantCount ({participantCount}) exceeds facility capacity ({facility.Capacity}).");

            if (!await _context.Activities.AnyAsync(a => a.Id == activityId))
                errors.Add($"Activity #{activityId} does not exist.");

            if (instructorId.HasValue)
            {
                if (!await _context.Instructors.AnyAsync(i => i.Id == instructorId))
                {
                    errors.Add($"Instructor #{instructorId} does not exist.");
                }
                else
                {
                    // Fetch the instructor's qualified activity IDs in one query.
                    // If the list is non-empty and does not contain this activity, reject.
                    // If the list is empty, the instructor is treated as universally qualified
                    // (backward-compatible with seed data that predates the InstructorSkill table).
                    var qualifiedActivityIds = await _context.InstructorSkills
                        .Where(s => s.InstructorId == instructorId.Value)
                        .Select(s => s.ActivityId)
                        .ToListAsync();

                    if (qualifiedActivityIds.Count > 0 &&
                        !qualifiedActivityIds.Contains(activityId))
                    {
                        errors.Add(
                            $"Instructor #{instructorId} is not qualified for Activity #{activityId}.");
                    }
                }
            }

            return errors;
        }

        /// <summary>
        /// Validates a single time window.
        /// All DateTime values are treated as UTC.  Unspecified-kind values are
        /// coerced to UTC so that the comparison with DateTime.UtcNow is consistent.
        /// A <see cref="PastToleranceSeconds"/> buffer absorbs minor clock skew.
        /// </summary>
        private static List<string> ValidateTimeWindow(
            DateTime start, DateTime end, string? tag = null)
        {
            var prefix = tag is null ? "" : $"[{tag}] ";
            var errors = new List<string>();

            // Coerce to UTC regardless of the .Kind stored on the incoming value.
            var startUtc = ToUtc(start);
            var endUtc   = ToUtc(end);

            if (startUtc >= endUtc)
                errors.Add($"{prefix}StartTime must be earlier than EndTime.");

            if (startUtc < DateTime.UtcNow.AddSeconds(-PastToleranceSeconds))
                errors.Add($"{prefix}StartTime cannot be in the past.");

            return errors;
        }

        private static List<string> ValidateAvailabilityParams(
            int slotMinutes, int openHour, int closeHour, DateTime date)
        {
            var errors = new List<string>();

            if (!AllowedSlotDurations.Contains(slotMinutes))
                errors.Add(
                    $"SlotDurationMinutes must be one of: {string.Join(", ", AllowedSlotDurations)}.");

            if (openHour is < 0 or > 23)
                errors.Add("OpenHour must be between 0 and 23.");

            if (closeHour is < 1 or > 24)
                errors.Add("CloseHour must be between 1 and 24.");

            if (openHour >= closeHour)
                errors.Add("OpenHour must be earlier than CloseHour.");

            if (date.Date < DateTime.UtcNow.Date)
                errors.Add("Date cannot be in the past.");

            return errors;
        }

        // ── Conflict detection ───────────────────────────────────────────────

        /// <summary>
        /// Checks every slot in <paramref name="slots"/> for conflicts with existing
        /// FacilityReservation and (optionally) InstructorReservation rows.
        ///
        /// Overlap rule (Allen's interval test):
        ///   existing.StartTime &lt; slot.EndTime  AND  existing.EndTime &gt; slot.StartTime
        ///
        /// This method must be called INSIDE a SERIALIZABLE transaction so that SQL Server
        /// holds range locks preventing concurrent inserts for the same windows.
        ///
        /// Note on N-per-slot queries:
        ///   Each slot issues up to two queries.  For typical bookings (≤ 10 slots) this
        ///   is acceptable.  A future optimisation could batch all slots into a single
        ///   predicate using raw SQL or a compiled expression tree.
        /// </summary>
        private async Task<List<string>> CheckSlotConflictsAsync(
            int facilityId, int? instructorId,
            List<TimeSlotRequest> slots, int? excludeBookingId = null)
        {
            var errors = new List<string>();

            foreach (var slot in slots)
            {
                // ── Facility conflict ────────────────────────────────────────
                var facilityBusy = await _context.FacilityReservations.AnyAsync(r =>
                    r.FacilityId == facilityId &&
                    r.Status != ReservationStatus.Cancelled &&
                    (excludeBookingId == null || r.BookingId != excludeBookingId) &&
                    r.StartTime < slot.EndTime && r.EndTime > slot.StartTime);

                if (facilityBusy)
                    errors.Add(
                        $"Facility #{facilityId} is already reserved for " +
                        $"{slot.StartTime:dd MMM yyyy HH:mm} – {slot.EndTime:HH:mm}.");

                // ── Instructor conflict ─────────────────────────────────────
                if (instructorId.HasValue)
                {
                    var instructorBusy = await _context.InstructorReservations.AnyAsync(r =>
                        r.InstructorId == instructorId.Value &&
                        r.Status != ReservationStatus.Cancelled &&
                        (excludeBookingId == null || r.BookingId != excludeBookingId) &&
                        r.StartTime < slot.EndTime && r.EndTime > slot.StartTime);

                    if (instructorBusy)
                        errors.Add(
                            $"Instructor #{instructorId} is already reserved for " +
                            $"{slot.StartTime:dd MMM yyyy HH:mm} – {slot.EndTime:HH:mm}.");
                }
            }

            return errors;
        }

        /// <summary>
        /// Checks that no two slots in the same multi-slot request overlap each other.
        /// This is separate from the DB conflict check because sibling slots do not yet
        /// exist in the database when the request is being processed.
        ///
        /// Example caught here: slots [10:00-12:00] and [11:00-13:00] would pass the DB
        /// check (no existing rows) but should be rejected because they overlap each other.
        /// </summary>
        private static List<string> CheckIntraSlotOverlaps(List<TimeSlotRequest> slots)
        {
            var errors = new List<string>();

            for (var i = 0; i < slots.Count; i++)
            for (var j = i + 1; j < slots.Count; j++)
            {
                var a = slots[i];
                var b = slots[j];

                if (a.StartTime < b.EndTime && a.EndTime > b.StartTime)
                    errors.Add(
                        $"Slot {i + 1} ({a.StartTime:HH:mm}–{a.EndTime:HH:mm}) " +
                        $"overlaps Slot {j + 1} ({b.StartTime:HH:mm}–{b.EndTime:HH:mm}).");
            }

            return errors;
        }

        // ── Build / factory helpers ──────────────────────────────────────────

        /// <summary>
        /// Builds the complete Booking aggregate in memory.
        /// EF Core will set the BookingId FK on all child rows automatically from the
        /// navigation property when the context saves — no need to set it explicitly.
        /// </summary>
        private static Booking BuildBookingAggregate(
            int tenantId,
            int userId, int facilityId, int activityId, int? instructorId,
            BookingType bookingType, List<TimeSlotRequest> slots,
            int participantCount, string? notes, List<BookingParticipantDto>? participants)
        {
            var now = DateTime.UtcNow;

            var booking = new Booking
            {
                TenantId         = tenantId,
                UserId           = userId,
                FacilityId       = facilityId,
                ActivityId       = activityId,
                InstructorId     = instructorId,
                BookingType      = bookingType,
                StartTime        = slots.Min(s => ToUtc(s.StartTime)),
                EndTime          = slots.Max(s => ToUtc(s.EndTime)),
                ParticipantCount = participantCount,
                Notes            = notes,
                Status           = BookingStatus.Pending,
                CreatedAt        = now,
                UpdatedAt        = now,
            };

            // Participants — only add when explicitly provided
            if (participants?.Count > 0)
                foreach (var p in participants)
                    booking.Participants.Add(new BookingParticipant
                    {
                        FullName = p.FullName,
                        Email    = p.Email,
                        Phone    = p.Phone,
                    });

            // Facility reservations — one row per slot
            foreach (var slot in slots)
                booking.FacilityReservations.Add(
                    BuildFacilityReservation(facilityId, slot.StartTime, slot.EndTime));

            // Instructor reservations — one row per slot when requested
            if (instructorId.HasValue)
                foreach (var slot in slots)
                    booking.InstructorReservations.Add(
                        BuildInstructorReservation(
                            instructorId.Value, activityId, slot.StartTime, slot.EndTime));

            return booking;
        }

        /// <summary>
        /// Factory for FacilityReservation.
        /// BookingId is intentionally NOT set here — EF Core derives it from the
        /// parent Booking's navigation property collection, avoiding the bookingId=0 antipattern.
        /// </summary>
        private static FacilityReservation BuildFacilityReservation(
            int facilityId, DateTime start, DateTime end) => new()
        {
            FacilityId      = facilityId,
            ReservationDate = start.Date,
            StartTime       = ToUtc(start),
            EndTime         = ToUtc(end),
            Status          = ReservationStatus.Pending,
        };

        /// <summary>Same pattern as BuildFacilityReservation — BookingId set by EF Core.</summary>
        private static InstructorReservation BuildInstructorReservation(
            int instructorId, int activityId, DateTime start, DateTime end) => new()
        {
            InstructorId    = instructorId,
            ActivityId      = activityId,
            ReservationDate = start.Date,
            StartTime       = ToUtc(start),
            EndTime         = ToUtc(end),
            Status          = ReservationStatus.Pending,
        };

        // ── Availability helpers ─────────────────────────────────────────────

        private record Interval(DateTime Start, DateTime End);
        private record SlotResult(List<AvailableSlotDto> Slots, int Total);

        private static SlotResult GenerateAvailableSlots(
            DateTime dayStart, DateTime dayEnd,
            TimeSpan slotDuration, List<Interval> reserved)
        {
            var available = new List<AvailableSlotDto>();
            var total     = 0;
            var cursor    = dayStart;

            while (cursor + slotDuration <= dayEnd)
            {
                var slotEnd = cursor + slotDuration;
                total++;

                var isFree = !reserved.Any(r => r.Start < slotEnd && r.End > cursor);
                if (isFree)
                    available.Add(new AvailableSlotDto { StartTime = cursor, EndTime = slotEnd });

                cursor = slotEnd;
            }

            return new SlotResult(available, total);
        }

        // ── Navigation / mapping ─────────────────────────────────────────────

        private async Task<Booking?> FindWithNavigationsAsync(int id) =>
            await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Facility)
                .Include(b => b.Activity)
                .Include(b => b.Instructor)
                .Include(b => b.Participants)
                .Include(b => b.FacilityReservations)
                .Include(b => b.InstructorReservations).ThenInclude(r => r.Instructor)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id);

        private static BookingResponse MapToResponse(Booking b) => new()
        {
            Id             = b.Id,
            UserId         = b.UserId,
            UserName       = b.User?.FullName       ?? string.Empty,
            FacilityId     = b.FacilityId,
            FacilityName   = b.Facility?.Name       ?? string.Empty,
            ActivityId     = b.ActivityId,
            ActivityName   = b.Activity?.Name       ?? string.Empty,
            InstructorId   = b.InstructorId,
            InstructorName = b.Instructor?.Name,
            StartTime      = b.StartTime,
            EndTime        = b.EndTime,
            Status         = b.Status,
            BookingType      = b.BookingType,
            ParticipantCount = b.ParticipantCount,
            Notes            = b.Notes,
            CreatedAt        = b.CreatedAt,
            UpdatedAt        = b.UpdatedAt,

            Participants = b.Participants.Select(p => new BookingParticipantDto
            {
                FullName = p.FullName,
                Email    = p.Email,
                Phone    = p.Phone,
            }).ToList(),

            FacilityReservations = b.FacilityReservations
                .OrderBy(r => r.StartTime)
                .Select(r => new FacilityReservationDto
                {
                    Id              = r.Id,
                    FacilityId      = r.FacilityId,
                    ReservationDate = r.ReservationDate,
                    StartTime       = r.StartTime,
                    EndTime         = r.EndTime,
                    Status          = r.Status,
                }).ToList(),

            InstructorReservations = b.InstructorReservations
                .OrderBy(r => r.StartTime)
                .Select(r => new InstructorReservationDto
                {
                    Id              = r.Id,
                    InstructorId    = r.InstructorId,
                    InstructorName  = r.Instructor?.Name,
                    ActivityId      = r.ActivityId,
                    ReservationDate = r.ReservationDate,
                    StartTime       = r.StartTime,
                    EndTime         = r.EndTime,
                    Status          = r.Status,
                }).ToList(),
        };

        // ── Utility ──────────────────────────────────────────────────────────

        /// <summary>
        /// Converts a DateTime to UTC.  Values with Kind = Unspecified are treated as
        /// UTC, which is the contract the API enforces for all incoming DateTimes.
        /// </summary>
        private static DateTime ToUtc(DateTime dt) =>
            dt.Kind == DateTimeKind.Local
                ? dt.ToUniversalTime()
                : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        private static List<TimeSlotRequest> SingleSlot(DateTime start, DateTime end) =>
            [new TimeSlotRequest { StartTime = start, EndTime = end }];

        /// <summary>
        /// When the caller provides an explicit participant list but leaves ParticipantCount
        /// at its default of 1, derive the count from the list length.
        /// Works for both CreateBookingRequest and CreateMultiSlotBookingRequest.
        /// </summary>
        private static void NormaliseParticipantCount(CreateBookingRequest req)
        {
            if (req.Participants?.Count > req.ParticipantCount)
                req.ParticipantCount = req.Participants.Count;
        }

        private static void NormaliseParticipantCount(CreateMultiSlotBookingRequest req)
        {
            if (req.Participants?.Count > req.ParticipantCount)
                req.ParticipantCount = req.Participants.Count;
        }

        private static (DateTime Start, DateTime End) DayWindow(
            DateTime date, int openHour, int closeHour)
        {
            var day = date.Date;
            return (day.AddHours(openHour), day.AddHours(closeHour));
        }
    }
}
