namespace BookingPlatform.Api.Entities
{
    public class User
    {
        public int    Id           { get; set; }

        /// <summary>Backward-compatible display name. Auto-derived from FirstName+LastName on profile update.</summary>
        public string FullName     { get; set; } = "";
        public string Email        { get; set; } = "";

        /// <summary>PBKDF2-SHA512 hash. Null for seed / legacy rows.</summary>
        public string? PasswordHash { get; set; }

        /// <summary>One of: SuperAdmin | TenantAdmin | FacilityOrganizer | Customer.</summary>
        public string Role { get; set; } = Roles.Customer;

        /// <summary>Null for SuperAdmin users who are not scoped to a tenant.</summary>
        public int?    TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        /// <summary>When false, the user cannot sign in (member management / soft delete).</summary>
        public bool IsActive { get; set; } = true;

        // ── Extended profile ─────────────────────────────────────────────────
        public string? FirstName   { get; set; }
        public string? LastName    { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address     { get; set; }
        public string? City        { get; set; }
        public string? State       { get; set; }
        public string? CountryName { get; set; }
        public string? PostalCode  { get; set; }

        public ICollection<Booking>          Bookings        { get; set; } = new List<Booking>();
        public ICollection<Complaint>        Complaints      { get; set; } = new List<Complaint>();
        public ICollection<ComplaintComment> Comments        { get; set; } = new List<ComplaintComment>();
        public ICollection<VenueOrganizer>   VenueOrganizers { get; set; } = new List<VenueOrganizer>();
    }
}