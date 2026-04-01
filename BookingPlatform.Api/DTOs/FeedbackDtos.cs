using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class FeedbackDto
    {
        public int Id { get; set; }
        public string TargetType { get; set; } = "Venue";
        public int TargetId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpsertFeedbackRequest
    {
        [Required]
        public string TargetType { get; set; } = "Venue"; // Venue | Facility

        [Required]
        public int TargetId { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; } = 5;

        [MaxLength(2000)]
        public string? Comment { get; set; }
    }
}

