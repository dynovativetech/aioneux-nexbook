using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class UpdateProfileRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required, MaxLength(100)] public string FirstName { get; set; } = "";
        [Required, MaxLength(100)] public string LastName  { get; set; } = "";

        /// <summary>Mobile number (mandatory).</summary>
        [Required, MaxLength(30)] public string PhoneNumber { get; set; } = "";

        /// <summary>Phone number (optional).</summary>
        [MaxLength(30)] public string? LandlinePhone { get; set; }

        // Address
        [MaxLength(50)]  public string? ApartmentOrVillaNumber { get; set; }
        [Required, MaxLength(300)] public string StreetAddress { get; set; } = "";
        [Required, MaxLength(150)] public string City          { get; set; } = "";
        [Required, MaxLength(150)] public string State         { get; set; } = "";
        [Required, MaxLength(100)] public string CountryName   { get; set; } = "";

        /// <summary>Emirate is required when CountryName is UAE.</summary>
        [MaxLength(100)] public string? Emirate { get; set; }

        [MaxLength(20)]  public string? PostalCode  { get; set; }

        /// <summary>Tenant-scoped classification (mandatory).</summary>
        [Required] public int? AreaId { get; set; }
        [Required] public int? CommunityId { get; set; }
    }
}
