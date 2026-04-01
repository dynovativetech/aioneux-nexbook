namespace BookingPlatform.Api.Entities
{
    public class AnnouncementView
    {
        public int Id { get; set; }

        public int           AnnouncementId { get; set; }
        public Announcement? Announcement   { get; set; }

        public int   UserId { get; set; }
        public User? User   { get; set; }

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}

