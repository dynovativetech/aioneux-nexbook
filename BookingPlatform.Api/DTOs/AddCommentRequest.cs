using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class AddCommentRequest
    {
        [Required]
        public int AuthorId { get; set; }

        [Required, MaxLength(2000)]
        public string Text { get; set; } = string.Empty;

        public bool IsAdminComment { get; set; }
    }
}
