namespace BookingPlatform.Api.Entities
{
    public class CommunityRule
    {
        public int Id { get; set; }

        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        public int?  AreaId { get; set; }
        public Area? Area   { get; set; }

        public int?       CommunityId { get; set; }
        public Community? Community   { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Body  { get; set; } = string.Empty;

        public int  SortOrder { get; set; } = 0;
        public bool IsActive  { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

