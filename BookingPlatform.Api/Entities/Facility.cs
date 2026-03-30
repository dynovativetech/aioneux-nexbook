namespace BookingPlatform.Api.Entities
{
    public class Facility
    {
        public int    Id       { get; set; }
        public string Name     { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int    Capacity { get; set; }

        // ── Multi-tenancy ────────────────────────────────────────────────────
        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        // ── Venue link ───────────────────────────────────────────────────────
        public int?   VenueId { get; set; }
        public Venue? Venue   { get; set; }

        // ── Rich metadata ────────────────────────────────────────────────────
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
        public bool    IsActive                { get; set; } = true;
        public bool    RequiresApproval        { get; set; }

        // ── Slot configuration ────────────────────────────────────────────────
        /// <summary>
        /// Minimum bookable slot in minutes. Default 60 (1 hour).
        /// Used by the availability engine to generate slots from operating hours.
        /// </summary>
        public int     SlotDurationMinutes     { get; set; } = 60;

        /// <summary>
        /// Maximum number of consecutive slots a single booking can reserve.
        /// Acts as a fair-usage cap (e.g. max 3 × 1-hour = 3-hour booking).
        /// </summary>
        public int     MaxConsecutiveSlots     { get; set; } = 3;

        public ICollection<Booking>                Bookings             { get; set; } = [];
        public ICollection<FacilityReservation>    FacilityReservations { get; set; } = [];
        public ICollection<FacilityImage>          Images               { get; set; } = [];
        public ICollection<FacilityActivity>       FacilityActivities   { get; set; } = [];
        public ICollection<FacilityOperatingHours> OperatingHours       { get; set; } = [];
    }
}
