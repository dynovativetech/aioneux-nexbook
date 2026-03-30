namespace BookingPlatform.Api.Entities
{
    public class User
    {
        public int    Id           { get; set; }
        public string FullName     { get; set; } = "";
        public string Email        { get; set; } = "";

        /// <summary>PBKDF2-SHA512 hash. Null for seed / legacy rows.</summary>
        public string? PasswordHash { get; set; }

        /// <summary>One of: SuperAdmin | TenantAdmin | FacilityOrganizer | Customer.</summary>
        public string Role { get; set; } = Roles.Customer;

        /// <summary>Null for SuperAdmin users who are not scoped to a tenant.</summary>
        public int?    TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        public ICollection<Booking>          Bookings        { get; set; } = new List<Booking>();
        public ICollection<Complaint>        Complaints      { get; set; } = new List<Complaint>();
        public ICollection<ComplaintComment> Comments        { get; set; } = new List<ComplaintComment>();
        public ICollection<VenueOrganizer>   VenueOrganizers { get; set; } = new List<VenueOrganizer>();
    }
}