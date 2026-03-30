namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Assignment table that links a User (with FacilityOrganizer role) to a Venue they manage.
    /// Composite PK: (VenueId, UserId).
    ///
    /// In addition to the FK link, this entity stores the organizer's contact profile
    /// for this specific venue assignment (official email, phone, etc.) which may differ
    /// from the User account's base details.
    /// </summary>
    public class VenueOrganizer
    {
        public int    VenueId       { get; set; }
        public Venue? Venue         { get; set; }

        public int    UserId        { get; set; }
        public User?  User          { get; set; }

        // ── Organizer profile for this venue ─────────────────────────────────
        public string? FirstName     { get; set; }
        public string? LastName      { get; set; }

        /// <summary>Personal email (may differ from User.Email login).</summary>
        public string? Email         { get; set; }

        /// <summary>Official / work email shown on venue communications.</summary>
        public string? OfficialEmail { get; set; }

        public string? Phone         { get; set; }
        public string? Mobile        { get; set; }
        public string? Website       { get; set; }

        public DateTime AssignedAt   { get; set; } = DateTime.UtcNow;
    }
}
