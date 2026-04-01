using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class AdminMemberListDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; } // mobile
        public string? LandlinePhone { get; set; }
        public string? City { get; set; }
        public string? CountryName { get; set; }
        public int? AreaId { get; set; }
        public string? AreaName { get; set; }
        public int? CommunityId { get; set; }
        public string? CommunityName { get; set; }
        public bool IsActive { get; set; }
    }

    public class AdminMemberDetailDto : AdminMemberListDto
    {
        public string? ApartmentOrVillaNumber { get; set; }
        public string? StreetAddress { get; set; }
        public string? State { get; set; }
        public string? Emirate { get; set; }
        public string? PostalCode { get; set; }
    }

    public class CreateMemberRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required, MaxLength(100)] public string FirstName { get; set; } = "";
        [Required, MaxLength(100)] public string LastName  { get; set; } = "";

        /// <summary>Mobile number (mandatory).</summary>
        [Required, MaxLength(30)] public string PhoneNumber { get; set; } = "";

        /// <summary>Phone number (optional).</summary>
        [MaxLength(30)] public string? LandlinePhone { get; set; }

        [MaxLength(50)] public string? ApartmentOrVillaNumber { get; set; }
        [Required, MaxLength(300)] public string StreetAddress { get; set; } = "";
        [Required, MaxLength(150)] public string City { get; set; } = "";
        [Required, MaxLength(150)] public string State { get; set; } = "";
        [Required, MaxLength(100)] public string CountryName { get; set; } = "";
        [MaxLength(100)] public string? Emirate { get; set; }
        public string? PostalCode { get; set; }

        [Required] public int? AreaId { get; set; }
        [Required] public int? CommunityId { get; set; }
    }

    public class UpdateMemberRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required, MaxLength(100)] public string FirstName { get; set; } = "";
        [Required, MaxLength(100)] public string LastName  { get; set; } = "";

        [Required, MaxLength(30)] public string PhoneNumber { get; set; } = "";
        [MaxLength(30)] public string? LandlinePhone { get; set; }

        [MaxLength(50)] public string? ApartmentOrVillaNumber { get; set; }
        [Required, MaxLength(300)] public string StreetAddress { get; set; } = "";
        [Required, MaxLength(150)] public string City { get; set; } = "";
        [Required, MaxLength(150)] public string State { get; set; } = "";
        [Required, MaxLength(100)] public string CountryName { get; set; } = "";
        [MaxLength(100)] public string? Emirate { get; set; }
        public string? PostalCode { get; set; }

        [Required] public int? AreaId { get; set; }
        [Required] public int? CommunityId { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CreateMemberResponse
    {
        public int UserId { get; set; }
        public string Email { get; set; } = "";
        public string FullName { get; set; } = "";
        public string TempPassword { get; set; } = "";
    }

    public class ResetMemberPasswordResponse
    {
        public int UserId { get; set; }
        public string TempPassword { get; set; } = "";
    }
}
