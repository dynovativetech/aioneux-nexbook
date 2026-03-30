namespace BookingPlatform.Api.Entities
{
    public class FacilityImage
    {
        public int      Id         { get; set; }
        public int      FacilityId { get; set; }
        public Facility? Facility  { get; set; }
        public string   ImageUrl   { get; set; } = string.Empty;
        public bool     IsPrimary  { get; set; }
        public int      SortOrder  { get; set; }
    }
}
