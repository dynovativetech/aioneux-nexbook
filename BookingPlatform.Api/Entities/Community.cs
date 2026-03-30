namespace BookingPlatform.Api.Entities
{
    public class Community
    {
        public int     Id          { get; set; }
        public int     AreaId      { get; set; }
        public Area?   Area        { get; set; }
        public int     TenantId    { get; set; }
        public Tenant? Tenant      { get; set; }
        public string  Name        { get; set; } = string.Empty;
        public string? Description { get; set; }

        public ICollection<Venue> Venues { get; set; } = [];
    }
}
