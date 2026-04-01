namespace BookingPlatform.Api.Entities
{
    public class Feedback
    {
        public int Id { get; set; }

        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        public int   UserId { get; set; }
        public User? User   { get; set; }

        public ContentTargetType TargetType { get; set; } = ContentTargetType.Venue;
        public int TargetId { get; set; }

        public int Rating { get; set; } = 5; // 1-5
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

