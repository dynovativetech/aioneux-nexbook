using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class InstructorAvailabilityRequest
    {
        [Required]
        public int InstructorId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        /// <summary>Slot duration in minutes. Allowed: 15, 30, 45, 60, 90, 120.</summary>
        public int SlotDurationMinutes { get; set; } = 60;

        /// <summary>Instructor starts taking sessions at this hour (24h). Default: 8.</summary>
        public int OpenHour  { get; set; } = 8;

        /// <summary>Instructor stops taking sessions at this hour (24h). Default: 22.</summary>
        public int CloseHour { get; set; } = 22;
    }
}
