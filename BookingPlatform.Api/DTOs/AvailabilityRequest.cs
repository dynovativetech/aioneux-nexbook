using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class AvailabilityRequest
    {
        [Required]
        public int FacilityId { get; set; }

        /// <summary>Date to check availability for. Format: yyyy-MM-dd</summary>
        [Required]
        public DateTime Date { get; set; }

        /// <summary>Duration of each time slot in minutes. Allowed: 15, 30, 45, 60, 90, 120.</summary>
        public int SlotDurationMinutes { get; set; } = 60;

        /// <summary>When provided, only slots where this instructor is also free are returned.</summary>
        public int? InstructorId { get; set; }

        /// <summary>Facility opening hour (24h). Default: 8</summary>
        public int OpenHour { get; set; } = 8;

        /// <summary>Facility closing hour (24h). Default: 22</summary>
        public int CloseHour { get; set; } = 22;
    }
}
