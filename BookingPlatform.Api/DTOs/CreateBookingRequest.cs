using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// Request payload for POST /api/bookings/single.
    /// Also used internally by CreateGroupBookingRequest (which extends it).
    /// </summary>
    public class CreateBookingRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int FacilityId { get; set; }

        /// <summary>Optional. When null the booking is not tied to a specific activity (free-use).</summary>
        public int? ActivityId { get; set; }

        /// <summary>Optional. When supplied the instructor will be validated and reserved.</summary>
        public int? InstructorId { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        /// <summary>Total number of people attending. Must be ≥ 1 and ≤ Facility.Capacity.</summary>
        [Range(1, 10_000)]
        public int ParticipantCount { get; set; } = 1;

        /// <summary>
        /// Optional list of named participants. When provided the count is auto-set
        /// from the list length if ParticipantCount is left at 1 and the list is longer.
        /// </summary>
        public List<BookingParticipantDto>? Participants { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
