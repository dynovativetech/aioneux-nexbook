namespace BookingPlatform.Api.Entities
{
    public class ComplaintComment
    {
        public int    Id          { get; set; }

        public int    ComplaintId { get; set; }
        public Complaint? Complaint { get; set; }

        /// <summary>The user who wrote the comment (can be the complainant or an admin).</summary>
        public int    AuthorId    { get; set; }
        public User?  Author      { get; set; }

        public string Text        { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
