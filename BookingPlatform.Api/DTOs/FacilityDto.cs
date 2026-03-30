namespace BookingPlatform.Api.DTOs
{
    public class CreateFacilityRequest
    {
        public string  Name                    { get; set; } = string.Empty;
        public string  Location                { get; set; } = string.Empty;
        public int     Capacity                { get; set; }
        public int?    VenueId                 { get; set; }
        public string? Code                    { get; set; }
        public string? Description             { get; set; }
        public string? ShortDescription        { get; set; }
        public double? Latitude                { get; set; }
        public double? Longitude               { get; set; }
        public string? MapAddress              { get; set; }
        public string? PhysicalAddress         { get; set; }
        public string? ContactPersonName       { get; set; }
        public string? ContactEmail            { get; set; }
        public string? ContactPhone            { get; set; }
        public string? BookingConfirmationEmail { get; set; }
        public bool    RequiresApproval        { get; set; }
        public int     SlotDurationMinutes     { get; set; } = 60;
        public int     MaxConsecutiveSlots     { get; set; } = 3;
    }

    public class FacilityImageResponse
    {
        public int    Id        { get; set; }
        public string ImageUrl  { get; set; } = string.Empty;
        public bool   IsPrimary { get; set; }
        public int    SortOrder { get; set; }
    }

    public class FacilityResponse
    {
        public int      Id                    { get; set; }
        public string   Name                  { get; set; } = string.Empty;
        public string   Location              { get; set; } = string.Empty;
        public int      Capacity              { get; set; }
        public int      TenantId              { get; set; }
        public int?     VenueId               { get; set; }
        public string?  VenueName             { get; set; }
        public string?  Code                  { get; set; }
        public string?  Description           { get; set; }
        public string?  ShortDescription      { get; set; }
        public double?  Latitude              { get; set; }
        public double?  Longitude             { get; set; }
        public string?  MapAddress            { get; set; }
        public string?  PhysicalAddress       { get; set; }
        public string?  ContactPersonName     { get; set; }
        public string?  ContactEmail          { get; set; }
        public string?  ContactPhone          { get; set; }
        public string?  BookingConfirmationEmail { get; set; }
        public bool     IsActive              { get; set; }
        public bool     RequiresApproval      { get; set; }
        public List<FacilityImageResponse> Images { get; set; } = [];
    }
}
