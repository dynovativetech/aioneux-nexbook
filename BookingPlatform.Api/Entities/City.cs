namespace BookingPlatform.Api.Entities
{
    /// <summary>Shared reference data — not tenant-scoped.</summary>
    public class City
    {
        public int     Id        { get; set; }
        public int     CountryId { get; set; }
        public Country? Country  { get; set; }
        public string  Name      { get; set; } = string.Empty;

        public ICollection<Area> Areas { get; set; } = [];
    }
}
