namespace BookingPlatform.Api.Entities
{
    public class Area
    {
        public int    Id       { get; set; }
        public int    CityId   { get; set; }
        public City?  City     { get; set; }
        public int    TenantId { get; set; }
        public Tenant? Tenant  { get; set; }
        public string Name     { get; set; } = string.Empty;

        public ICollection<Community> Communities { get; set; } = [];
    }
}
