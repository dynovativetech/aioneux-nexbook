using System.ComponentModel.DataAnnotations;
using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    public class UpdateComplaintStatusRequest
    {
        [Required]
        public ComplaintStatus Status { get; set; }

        /// <summary>Optional note explaining the status change (visible as a system comment).</summary>
        [MaxLength(1000)]
        public string? AdminNote { get; set; }
    }
}
