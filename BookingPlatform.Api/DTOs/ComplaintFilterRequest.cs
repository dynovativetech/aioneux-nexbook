using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// Query-string parameters for filtering complaint lists (admin endpoint).
    /// All fields are optional — omitting a field means "no filter on that field".
    /// </summary>
    public class ComplaintFilterRequest
    {
        /// <summary>Filter by status (e.g. "Open", "InProgress").</summary>
        public ComplaintStatus? Status { get; set; }

        /// <summary>Filter by category name (exact match, case-insensitive).</summary>
        public string? Category { get; set; }

        /// <summary>Free-text search: matches title, user name, or complaint ID.</summary>
        public string? Search { get; set; }

        /// <summary>Include only complaints created on or after this date (UTC).</summary>
        public DateTime? DateFrom { get; set; }

        /// <summary>Include only complaints created on or before this date (end of day, UTC).</summary>
        public DateTime? DateTo { get; set; }

        /// <summary>Filter by the submitting user's Id (admin use).</summary>
        public int? UserId { get; set; }
    }
}
