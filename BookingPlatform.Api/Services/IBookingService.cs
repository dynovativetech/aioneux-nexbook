using BookingPlatform.Api.DTOs;

namespace BookingPlatform.Api.Services
{
    public interface IBookingService
    {
        // ── Query ────────────────────────────────────────────────────────────
        Task<ApiResponse<List<BookingResponse>>> GetAllAsync();
        Task<ApiResponse<BookingResponse>>       GetByIdAsync(int id);

        // ── Advanced creation (new engine) ───────────────────────────────────

        /// <summary>
        /// Creates a single-slot booking for one person.
        /// Validates FK references, time window, instructor qualification,
        /// facility and instructor conflicts, then persists atomically.
        /// </summary>
        Task<ApiResponse<BookingResponse>> CreateSingleBookingAsync(CreateBookingRequest request);

        /// <summary>
        /// Creates a group booking: one time slot shared by multiple participants.
        /// ParticipantCount must be ≥ 2 and must not exceed Facility.Capacity.
        /// Participant names are stored in BookingParticipant rows.
        /// </summary>
        Task<ApiResponse<BookingResponse>> CreateGroupBookingAsync(CreateGroupBookingRequest request);

        /// <summary>
        /// Creates a booking that spans multiple, potentially non-contiguous time slots.
        ///
        /// How multi-slot is handled:
        ///   ONE Booking record (BookingType = MultiSlot) is created as the parent aggregate.
        ///   Each slot in the request creates one FacilityReservation and optionally one
        ///   InstructorReservation as child rows.  All slots are validated for conflicts
        ///   BEFORE any database write; if any slot is unavailable the entire operation
        ///   is rejected, keeping the database consistent.  A database transaction wraps
        ///   all inserts so either all slots are booked or none are.
        /// </summary>
        Task<ApiResponse<BookingResponse>> CreateMultiSlotBookingAsync(CreateMultiSlotBookingRequest request);

        // ── Legacy creation (backward-compatible) ────────────────────────────
        /// <summary>Delegates to CreateSingleBookingAsync. Kept for backward compatibility.</summary>
        Task<ApiResponse<BookingResponse>> CreateAsync(CreateBookingRequest request);

        // ── Mutation ─────────────────────────────────────────────────────────
        Task<ApiResponse<BookingResponse>> UpdateAsync(int id, UpdateBookingRequest request);

        /// <summary>
        /// Cancels a booking and its associated FacilityReservation and InstructorReservation rows.
        /// </summary>
        Task<ApiResponse<bool>> CancelBookingAsync(int id);

        /// <summary>Alias for CancelBookingAsync (backward-compatible name).</summary>
        Task<ApiResponse<bool>> CancelAsync(int id);

        Task<ApiResponse<bool>> DeleteAsync(int id);

        // ── Availability ─────────────────────────────────────────────────────

        /// <summary>
        /// Returns available time slots for a facility on a given date,
        /// based on FacilityReservation records (not the legacy Bookings table).
        /// </summary>
        Task<ApiResponse<ResourceAvailabilityResponse>> GetAvailableFacilitySlotsAsync(FacilityAvailabilityRequest request);

        /// <summary>
        /// Returns available time slots for an instructor on a given date,
        /// based on InstructorReservation records.
        /// </summary>
        Task<ApiResponse<ResourceAvailabilityResponse>> GetAvailableInstructorSlotsAsync(InstructorAvailabilityRequest request);
    }
}
