using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class CommunityRulesDocumentDto
    {
        public int Id { get; set; }
        public int? AreaId { get; set; }
        public string? AreaName { get; set; }
        public int? CommunityId { get; set; }
        public string? CommunityName { get; set; }
        public string Html { get; set; } = "";
        public DateTime UpdatedAt { get; set; }
    }

    public class UpsertCommunityRulesDocumentRequest
    {
        public int? AreaId { get; set; }
        public int? CommunityId { get; set; }

        [Required, MaxLength(30000)]
        public string Html { get; set; } = "";
    }
}

