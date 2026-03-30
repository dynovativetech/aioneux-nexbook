using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class AddCommentRequest
    {
        [Required]
        public int AuthorId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Text { get; set; } = string.Empty;
    }
}
