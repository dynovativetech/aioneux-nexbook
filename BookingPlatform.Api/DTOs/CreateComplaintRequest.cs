using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class CreateComplaintRequest
    {
        [Required]
        public int UserId { get; set; }

        /// <summary>Optional — only required for booking-related categories.</summary>
        public int? BookingId { get; set; }

        public int?    CategoryId { get; set; }
        public string? Category   { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(2000)]
        public string Description { get; set; } = string.Empty;
    }
}
