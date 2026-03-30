using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    /// <summary>Represents one participant in a group or single booking.</summary>
    public class BookingParticipantDto
    {
        [Required, MaxLength(150)]
        public string  FullName { get; set; } = string.Empty;

        [EmailAddress, MaxLength(254)]
        public string? Email   { get; set; }

        [Phone, MaxLength(30)]
        public string? Phone   { get; set; }
    }
}
