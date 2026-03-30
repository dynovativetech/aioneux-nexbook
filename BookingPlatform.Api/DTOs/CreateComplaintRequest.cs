using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class CreateComplaintRequest
    {
        [Required]
        public int BookingId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;
    }
}
