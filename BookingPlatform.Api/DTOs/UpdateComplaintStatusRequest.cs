using System.ComponentModel.DataAnnotations;
using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    public class UpdateComplaintStatusRequest
    {
        [Required]
        public ComplaintStatus Status { get; set; }

        /// <summary>Admin user performing the status change (for system comment attribution).</summary>
        public int? AdminId { get; set; }

        /// <summary>Optional note explaining the status change (saved as a system comment).</summary>
        [MaxLength(2000)]
        public string? AdminNote { get; set; }
    }
}
