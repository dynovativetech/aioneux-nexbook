namespace BookingPlatform.Api.Entities
{
    public class CommunityRulesDocument
    {
        public int Id { get; set; }

        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        public int?  AreaId { get; set; }
        public Area? Area   { get; set; }

        public int?       CommunityId { get; set; }
        public Community? Community   { get; set; }

        public string Html { get; set; } = string.Empty;

        public int   UpdatedByUserId { get; set; }
        public User? UpdatedByUser   { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

