namespace BookingPlatform.Api.Entities
{
    public class Complaint
    {
        public int    Id          { get; set; }

        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        /// <summary>Optional — only set when complaint is related to a specific booking.</summary>
        public int?     BookingId { get; set; }
        public Booking? Booking   { get; set; }

        public int    UserId      { get; set; }
        public User?  User        { get; set; }

        public string Title       { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        /// <summary>Free-text category name (mirror of the selected ComplaintCategory).</summary>
        public string? Category   { get; set; }

        /// <summary>FK to ComplaintCategory (nullable for backward compat).</summary>
        public int?              CategoryId       { get; set; }
        public ComplaintCategory? ComplaintCategory { get; set; }

        /// <summary>Comma-separated relative paths of uploaded images.</summary>
        public string? ImagePaths { get; set; }

        public ComplaintStatus Status    { get; set; } = ComplaintStatus.Open;
        public DateTime        CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime?       UpdatedAt { get; set; }

        public ICollection<ComplaintComment> Comments { get; set; } = new List<ComplaintComment>();
    }
}
