using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class AdminAnnouncementListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public bool IsPublished { get; set; }
        public DateTime? PublishAt { get; set; }
        public int? AreaId { get; set; }
        public string? AreaName { get; set; }
        public int? CommunityId { get; set; }
        public string? CommunityName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class AdminAnnouncementDetailDto : AdminAnnouncementListDto
    {
        public string Body { get; set; } = "";
    }

    public class UpsertAnnouncementRequest
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = "";

        [Required, MaxLength(8000)]
        public string Body { get; set; } = "";

        public bool IsPublished { get; set; }
        public DateTime? PublishAt { get; set; }

        public int? AreaId { get; set; }
        public int? CommunityId { get; set; }
    }

    public class AnnouncementAnalyticsDto
    {
        public int AnnouncementId { get; set; }
        public string Title { get; set; } = "";
        public bool IsPublished { get; set; }
        public DateTime? PublishAt { get; set; }
        public int TotalViews { get; set; }
        public int UniqueViewers { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

