using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// Request payload for POST /api/bookings/multi-slot.
    ///
    /// Design choice — one parent Booking, many reservation rows:
    ///   A single Booking record is created with BookingType = MultiSlot.
    ///   Its StartTime/EndTime are set to the earliest/latest slot window.
    ///   Each element of Slots creates one FacilityReservation and optionally
    ///   one InstructorReservation child row.
    ///
    ///   This approach avoids a separate BookingGroup table while still letting
    ///   each slot be tracked, listed, and cancelled independently.
    ///   All reservation rows are created inside a single DB transaction — either
    ///   every slot is booked or none are, preventing partial failures.
    ///
    /// Example:
    ///   UserId = 1, FacilityId = 2, ActivityId = 3
    ///   Slots = [
    ///     { StartTime: "2026-05-01T10:00", EndTime: "2026-05-01T11:00" },
    ///     { StartTime: "2026-05-01T17:00", EndTime: "2026-05-01T18:00" },
    ///     { StartTime: "2026-05-03T09:00", EndTime: "2026-05-03T10:00" }
    ///   ]
    /// </summary>
    public class CreateMultiSlotBookingRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int FacilityId { get; set; }

        [Required]
        public int ActivityId { get; set; }

        public int? InstructorId { get; set; }

        /// <summary>Must contain at least 2 slots.</summary>
        [Required, MinLength(2)]
        public List<TimeSlotRequest> Slots { get; set; } = [];

        [Range(1, 10_000)]
        public int ParticipantCount { get; set; } = 1;

        public List<BookingParticipantDto>? Participants { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
