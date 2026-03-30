namespace BookingPlatform.Api.Entities
{
    public class Complaint
    {
        public int    Id          { get; set; }

        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        public int    BookingId   { get; set; }
        public Booking? Booking  { get; set; }

        public int    UserId      { get; set; }
        public User?  User        { get; set; }

        public string Title       { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ComplaintStatus Status    { get; set; } = ComplaintStatus.Open;
        public DateTime        CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ComplaintComment> Comments { get; set; } = new List<ComplaintComment>();
    }
}
