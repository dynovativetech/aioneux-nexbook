namespace BookingPlatform.Api.Entities
{
    public class Event
    {
        public int Id { get; set; }

        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        public int?  AreaId { get; set; }
        public Area? Area   { get; set; }

        public int?       CommunityId { get; set; }
        public Community? Community   { get; set; }

        public string Title       { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public DateTime StartsAt { get; set; }
        public DateTime? EndsAt  { get; set; }

        // ── Display & content ────────────────────────────────────────────────
        public string? MainImageUrl { get; set; }
        public string? LocationText { get; set; } // place name
        public string? AddressText  { get; set; }

        // ── Contact ─────────────────────────────────────────────────────────
        public string? ContactPersonName  { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? ContactPersonPhone { get; set; }

        public bool IsPublished { get; set; } = false;

        public int   CreatedByUserId { get; set; }
        public User? CreatedByUser   { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<EventRsvp> Rsvps { get; set; } = [];
        public ICollection<EventImage> Images { get; set; } = [];
    }
}

