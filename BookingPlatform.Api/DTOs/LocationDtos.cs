namespace BookingPlatform.Api.DTOs
{
    // ── Country ──────────────────────────────────────────────────────────────
    public class CountryResponse
    {
        public int    Id   { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class CreateCountryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    // ── City ──────────────────────────────────────────────────────────────────
    public class CityResponse
    {
        public int    Id          { get; set; }
        public int    CountryId   { get; set; }
        public string CountryName { get; set; } = string.Empty;
        public string Name        { get; set; } = string.Empty;
    }

    public class CreateCityRequest
    {
        public int    CountryId { get; set; }
        public string Name      { get; set; } = string.Empty;
    }

    // ── Area ─────────────────────────────────────────────────────────────────
    public class AreaResponse
    {
        public int    Id       { get; set; }
        public int    CityId   { get; set; }
        public string CityName { get; set; } = string.Empty;
        public int    TenantId { get; set; }
        public string Name     { get; set; } = string.Empty;
    }

    public class CreateAreaRequest
    {
        public int    CityId { get; set; }
        public string Name   { get; set; } = string.Empty;
    }

    // ── Community ─────────────────────────────────────────────────────────────
    public class CommunityResponse
    {
        public int     Id          { get; set; }
        public int     AreaId      { get; set; }
        public string  AreaName    { get; set; } = string.Empty;
        public int     TenantId    { get; set; }
        public string  Name        { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateCommunityRequest
    {
        public int     AreaId      { get; set; }
        public string  Name        { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    // ── Venue — full DTOs live in VenueDtos.cs
    // CreateVenueRequest and VenueResponse are defined there and imported here.
}
