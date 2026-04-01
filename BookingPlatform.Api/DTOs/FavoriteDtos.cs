using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class FavoriteDto
    {
        public int Id { get; set; }
        public string TargetType { get; set; } = "Venue";
        public int TargetId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Name { get; set; }
    }

    public class AddFavoriteRequest
    {
        [Required]
        public string TargetType { get; set; } = "Venue"; // Venue | Facility

        [Required]
        public int TargetId { get; set; }
    }
}

