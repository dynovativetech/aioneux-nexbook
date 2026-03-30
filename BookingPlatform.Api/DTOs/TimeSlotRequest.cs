using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// A single time window used inside CreateMultiSlotBookingRequest.
    /// Each instance maps to one FacilityReservation (and optionally one InstructorReservation).
    /// </summary>
    public class TimeSlotRequest
    {
        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }
    }
}
