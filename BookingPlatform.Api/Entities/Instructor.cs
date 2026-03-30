namespace BookingPlatform.Api.Entities
{
    public class Instructor
    {
        public int    Id              { get; set; }

        /// <summary>Full display name.</summary>
        public string Name            { get; set; } = string.Empty;

        /// <summary>
        /// Primary expertise category, e.g. "Yoga" or "Cycling".
        /// Used as a display tag; formal qualifications are tracked in InstructorSkill.
        /// </summary>
        public string Expertise       { get; set; } = string.Empty;

        public int    ExperienceYears { get; set; }

        /// <summary>Short biography shown on instructor profile pages.</summary>
        public string? Bio            { get; set; }

        /// <summary>
        /// Brief summary of expertise for display (e.g. "Level 3 PT, specialist in HIIT and boxing").
        /// </summary>
        public string? ExpertiseSummary { get; set; }

        // ── Multi-tenancy ────────────────────────────────────────────────────
        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        // ── Rich metadata ────────────────────────────────────────────────────
        public string? ProfileImageUrl { get; set; }
        public string? ContactEmail    { get; set; }
        public string? ContactPhone    { get; set; }
        public bool    IsActive        { get; set; } = true;

        // ── Collections ──────────────────────────────────────────────────────
        public ICollection<Booking>               Bookings               { get; set; } = [];
        public ICollection<InstructorSkill>       Skills                 { get; set; } = [];
        public ICollection<InstructorReservation> InstructorReservations { get; set; } = [];
    }
}
