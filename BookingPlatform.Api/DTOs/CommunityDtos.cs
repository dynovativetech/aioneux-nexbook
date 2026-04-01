using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class MemberAnnouncementDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Body { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsViewed { get; set; }
        public int? AreaId { get; set; }
        public int? CommunityId { get; set; }
    }

    public class CreateRuleRequest
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = "";

        [Required, MaxLength(8000)]
        public string Body { get; set; } = "";

        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        public int? AreaId { get; set; }
        public int? CommunityId { get; set; }
    }

    public class RuleDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Body { get; set; } = "";
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public int? AreaId { get; set; }
        public int? CommunityId { get; set; }
    }
}

