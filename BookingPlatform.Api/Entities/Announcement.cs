namespace BookingPlatform.Api.Entities
{
    public class Announcement
    {
        public int Id { get; set; }

        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        public int?   AreaId { get; set; }
        public Area?  Area   { get; set; }

        public int?       CommunityId { get; set; }
        public Community? Community   { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Body  { get; set; } = string.Empty;

        public bool      IsPublished { get; set; } = false;
        public DateTime? PublishAt   { get; set; }

        public int   CreatedByUserId { get; set; }
        public User? CreatedByUser   { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<AnnouncementView> Views { get; set; } = [];
    }
}

