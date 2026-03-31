using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class UpdateProfileRequest
    {
        [Required]
        public int UserId { get; set; }

        [MaxLength(100)] public string? FirstName   { get; set; }
        [MaxLength(100)] public string? LastName    { get; set; }
        [MaxLength(20)]  public string? PhoneNumber { get; set; }
        [MaxLength(300)] public string? Address     { get; set; }
        [MaxLength(100)] public string? City        { get; set; }
        [MaxLength(100)] public string? State       { get; set; }
        [MaxLength(100)] public string? CountryName { get; set; }
        [MaxLength(20)]  public string? PostalCode  { get; set; }
    }
}
