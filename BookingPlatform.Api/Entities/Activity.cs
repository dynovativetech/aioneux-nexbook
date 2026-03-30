namespace BookingPlatform.Api.Entities
{
    public class Activity
    {
        public int    Id              { get; set; }
        public string Name            { get; set; } = string.Empty;
        public int    DurationMinutes { get; set; }

        // ── Multi-tenancy ────────────────────────────────────────────────────
        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        // ── Rich metadata ────────────────────────────────────────────────────
        public string? Description    { get; set; }
        public string? Category       { get; set; }
        public int     BufferMinutes  { get; set; }
        public decimal Price          { get; set; }
        public bool    IsActive       { get; set; } = true;

        public ICollection<Booking>               Bookings               { get; set; } = [];
        public ICollection<InstructorSkill>       InstructorSkills       { get; set; } = [];
        public ICollection<InstructorReservation> InstructorReservations { get; set; } = [];
        public ICollection<FacilityActivity>      FacilityActivities     { get; set; } = [];
    }
}
