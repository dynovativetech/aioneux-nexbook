using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public class AvailabilityService : IAvailabilityService
    {
        private static readonly int[] AllowedSlotDurations = { 15, 30, 45, 60, 90, 120 };

        private readonly AppDbContext _context;

        public AvailabilityService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<AvailabilityResponse>> GetAvailableSlotsAsync(AvailabilityRequest request)
        {
            // ── 1. Validate request parameters ──────────────────────────────
            var validationErrors = ValidateRequest(request);
            if (validationErrors.Count > 0)
                return ApiResponse<AvailabilityResponse>.Fail("Invalid request.", validationErrors);

            // ── 2. Verify facility exists ────────────────────────────────────
            var facility = await _context.Facilities
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == request.FacilityId);

            if (facility is null)
                return ApiResponse<AvailabilityResponse>.Fail(
                    $"Facility with Id {request.FacilityId} does not exist.");

            // ── 3. Optionally verify instructor exists ───────────────────────
            Instructor? instructor = null;
            if (request.InstructorId.HasValue)
            {
                instructor = await _context.Instructors
                    .AsNoTracking()
                    .FirstOrDefaultAsync(i => i.Id == request.InstructorId);

                if (instructor is null)
                    return ApiResponse<AvailabilityResponse>.Fail(
                        $"Instructor with Id {request.InstructorId} does not exist.");
            }

            // ── 4. Build day window ──────────────────────────────────────────
            var day      = request.Date.Date;
            var dayStart = day.AddHours(request.OpenHour);
            var dayEnd   = day.AddHours(request.CloseHour);

            // ── 5. Fetch booked intervals for the facility (single query) ────
            //      Only active (non-cancelled) bookings that overlap the day.
            var facilityIntervals = await _context.Bookings
                .AsNoTracking()
                .Where(b =>
                    b.FacilityId == request.FacilityId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.StartTime < dayEnd &&
                    b.EndTime   > dayStart)
                .Select(b => new BookedInterval(b.StartTime, b.EndTime))
                .ToListAsync();

            // ── 6. Fetch booked intervals for instructor (single query) ──────
            List<BookedInterval> instructorIntervals = new();
            if (request.InstructorId.HasValue)
            {
                instructorIntervals = await _context.Bookings
                    .AsNoTracking()
                    .Where(b =>
                        b.InstructorId == request.InstructorId &&
                        b.Status != BookingStatus.Cancelled &&
                        b.StartTime < dayEnd &&
                        b.EndTime   > dayStart)
                    .Select(b => new BookedInterval(b.StartTime, b.EndTime))
                    .ToListAsync();
            }

            // ── 7. Generate slots and classify availability ──────────────────
            var slotDuration   = TimeSpan.FromMinutes(request.SlotDurationMinutes);
            var availableSlots = new List<TimeSlot>();
            var totalSlots     = 0;

            var slotStart = dayStart;
            while (slotStart + slotDuration <= dayEnd)
            {
                var slotEnd = slotStart + slotDuration;
                totalSlots++;

                bool facilityFree    = IsSlotFree(slotStart, slotEnd, facilityIntervals);
                bool instructorFree  = !request.InstructorId.HasValue ||
                                       IsSlotFree(slotStart, slotEnd, instructorIntervals);

                if (facilityFree && instructorFree)
                    availableSlots.Add(new TimeSlot { StartTime = slotStart, EndTime = slotEnd });

                slotStart = slotEnd;
            }

            // ── 8. Build response ────────────────────────────────────────────
            var response = new AvailabilityResponse
            {
                FacilityId          = facility.Id,
                FacilityName        = facility.Name,
                Date                = day,
                SlotDurationMinutes = request.SlotDurationMinutes,
                InstructorId        = instructor?.Id,
                InstructorName      = instructor?.Name,
                TotalSlots          = totalSlots,
                AvailableSlotCount  = availableSlots.Count,
                BookedSlotCount     = totalSlots - availableSlots.Count,
                AvailableSlots      = availableSlots
            };

            return ApiResponse<AvailabilityResponse>.Ok(response,
                availableSlots.Count > 0
                    ? $"{availableSlots.Count} slot(s) available."
                    : "No available slots for the selected criteria.");
        }

        // ── private helpers ────────────────────────────────────────────────

        /// <summary>
        /// A slot is free when no booked interval overlaps it.
        /// Overlap condition: bookedStart &lt; slotEnd AND bookedEnd &gt; slotStart
        /// </summary>
        private static bool IsSlotFree(
            DateTime slotStart,
            DateTime slotEnd,
            List<BookedInterval> intervals) =>
            !intervals.Any(i => i.Start < slotEnd && i.End > slotStart);

        private static List<string> ValidateRequest(AvailabilityRequest request)
        {
            var errors = new List<string>();

            if (!AllowedSlotDurations.Contains(request.SlotDurationMinutes))
                errors.Add($"SlotDurationMinutes must be one of: {string.Join(", ", AllowedSlotDurations)}.");

            if (request.OpenHour < 0 || request.OpenHour > 23)
                errors.Add("OpenHour must be between 0 and 23.");

            if (request.CloseHour < 1 || request.CloseHour > 24)
                errors.Add("CloseHour must be between 1 and 24.");

            if (request.OpenHour >= request.CloseHour)
                errors.Add("OpenHour must be earlier than CloseHour.");

            if (request.Date.Date < DateTime.UtcNow.Date)
                errors.Add("Date cannot be in the past.");

            return errors;
        }

        /// <summary>Lightweight projection to avoid loading full Booking entities.</summary>
        private record BookedInterval(DateTime Start, DateTime End);
    }
}
