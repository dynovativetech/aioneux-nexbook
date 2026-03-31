namespace BookingPlatform.Api.Entities
{
    public class ComplaintCategory
    {
        public int    Id       { get; set; }
        public int    TenantId { get; set; }
        public Tenant? Tenant  { get; set; }
        public string Name     { get; set; } = string.Empty;
        public bool   IsActive { get; set; } = true;
        public int    SortOrder { get; set; }
    }
}
