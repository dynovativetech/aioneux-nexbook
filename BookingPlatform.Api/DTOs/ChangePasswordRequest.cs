using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class ChangePasswordRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public string CurrentPassword { get; set; } = "";

        [Required, MinLength(6, ErrorMessage = "New password must be at least 6 characters.")]
        public string NewPassword { get; set; } = "";
    }
}
