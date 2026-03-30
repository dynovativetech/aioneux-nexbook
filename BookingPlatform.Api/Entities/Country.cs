namespace BookingPlatform.Api.Entities
{
    /// <summary>Shared reference data — not tenant-scoped.</summary>
    public class Country
    {
        public int    Id   { get; set; }
        public string Name { get; set; } = string.Empty;

        /// <summary>ISO 3166-1 alpha-2 code, e.g. "AE".</summary>
        public string Code { get; set; } = string.Empty;

        public ICollection<City> Cities { get; set; } = [];
    }
}
