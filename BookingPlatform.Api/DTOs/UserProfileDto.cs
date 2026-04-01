namespace BookingPlatform.Api.DTOs
{
    public class UserProfileDto
    {
        public int     UserId      { get; set; }
        public string  FullName    { get; set; } = "";
        public string  Email       { get; set; } = "";
        public string? FirstName   { get; set; }
        public string? LastName    { get; set; }

        /// <summary>Mobile number.</summary>
        public string? PhoneNumber { get; set; }

        /// <summary>Local landline.</summary>
        public string? LandlinePhone { get; set; }

        // Address
        public string? ApartmentOrVillaNumber { get; set; }
        public string? StreetAddress          { get; set; }
        public string? City                   { get; set; }
        public string? State                  { get; set; }
        public string? CountryName            { get; set; }
        public string? Emirate                { get; set; }
        public string? PostalCode             { get; set; }

        // Classification
        public int? AreaId { get; set; }
        public string? AreaName { get; set; }
        public int? CommunityId { get; set; }
        public string? CommunityName { get; set; }
    }
}
