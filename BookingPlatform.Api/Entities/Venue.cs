namespace BookingPlatform.Api.Entities
{
    public class Venue
    {
        public int       Id          { get; set; }
        public int       CommunityId { get; set; }
        public Community? Community  { get; set; }
        public int       TenantId    { get; set; }
        public Tenant?   Tenant      { get; set; }

        // ── Core identity ─────────────────────────────────────────────────────
        public string  Name             { get; set; } = string.Empty;
        public string? ShortDescription { get; set; }
        public string? Description      { get; set; }

        // ── Branding ──────────────────────────────────────────────────────────
        /// <summary>Stored filename of the venue logo (uploaded file).</summary>
        public string? LogoUrl          { get; set; }

        /// <summary>Stored filename of the hero/cover image (uploaded file).</summary>
        public string? CoverImageUrl    { get; set; }

        // ── Address and location ──────────────────────────────────────────────
        public string  Address          { get; set; } = string.Empty;
        public double? Latitude         { get; set; }
        public double? Longitude        { get; set; }

        /// <summary>Google Maps embed or share URL for displaying a map pin.</summary>
        public string? GoogleMapsUrl    { get; set; }

        // ── Contact details ───────────────────────────────────────────────────
        public string? Phone                { get; set; }
        public string? Mobile               { get; set; }
        public string? Website              { get; set; }
        public string? ContactPersonName    { get; set; }
        public string? ContactPersonEmail   { get; set; }
        public string? ContactPersonPhone   { get; set; }
        public string? ContactPersonMobile  { get; set; }

        // ── Status ────────────────────────────────────────────────────────────
        public bool IsActive { get; set; } = true;

        // ── Navigation ────────────────────────────────────────────────────────
        public ICollection<Facility>            Facilities     { get; set; } = [];
        public ICollection<VenueImage>          Images         { get; set; } = [];
        public ICollection<VenueOperatingHours> OperatingHours { get; set; } = [];
        public ICollection<VenueAmenity>        Amenities      { get; set; } = [];
        public ICollection<VenueOrganizer>      Organizers     { get; set; } = [];
    }
}
