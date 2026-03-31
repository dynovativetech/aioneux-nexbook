namespace BookingPlatform.Api.Entities
{
    public class ComplaintComment
    {
        public int    Id          { get; set; }

        public int    ComplaintId { get; set; }
        public Complaint? Complaint { get; set; }

        /// <summary>The user who wrote the comment (customer or admin).</summary>
        public int    AuthorId    { get; set; }
        public User?  Author      { get; set; }

        public string Text        { get; set; } = string.Empty;

        /// <summary>True when the comment was written by a Tenant Admin or system.</summary>
        public bool IsAdminComment  { get; set; }

        /// <summary>True for automated system-generated comments (e.g. status changes).</summary>
        public bool IsSystemComment { get; set; }

        /// <summary>Optional relative path of an image attached to this comment.</summary>
        public string? ImagePath  { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
