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
        public string? PhoneNumber { get; set; }
        public string? City { get; set; }
        public string? CountryName { get; set; }
        public bool IsActive { get; set; }
    }

    public class AdminMemberDetailDto : AdminMemberListDto
    {
        public string? Address { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
    }

    public class CreateMemberRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required, MinLength(1)]
        public string FullName { get; set; } = "";

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? CountryName { get; set; }
        public string? PostalCode { get; set; }
    }

    public class UpdateMemberRequest
    {
        [Required, MinLength(1)]
        public string FullName { get; set; } = "";

        [Required, EmailAddress]
        public string Email { get; set; } = "";

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? CountryName { get; set; }
        public string? PostalCode { get; set; }
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
