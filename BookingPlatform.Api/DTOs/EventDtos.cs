using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class AdminEventListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public bool IsPublished { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime? EndsAt { get; set; }
        public string? LocationText { get; set; }
        public string? MainImageUrl { get; set; }
        public string? AddressText { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? ContactPersonPhone { get; set; }
        public int? AreaId { get; set; }
        public string? AreaName { get; set; }
        public int? CommunityId { get; set; }
        public string? CommunityName { get; set; }
        public int RsvpGoingCount { get; set; }
        public int RsvpMaybeCount { get; set; }
        public int RsvpNotGoingCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class AdminEventDetailDto : AdminEventListDto
    {
        public string Description { get; set; } = "";
    }

    public class UpsertEventRequest
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = "";

        [Required, MaxLength(8000)]
        public string Description { get; set; } = "";

        [Required]
        public DateTime StartsAt { get; set; }

        public DateTime? EndsAt { get; set; }

        [MaxLength(300)]
        public string? LocationText { get; set; }

        [MaxLength(500)]
        public string? AddressText { get; set; }

        [MaxLength(150)]
        public string? ContactPersonName { get; set; }

        [EmailAddress, MaxLength(254)]
        public string? ContactPersonEmail { get; set; }

        [MaxLength(30)]
        public string? ContactPersonPhone { get; set; }

        public bool IsPublished { get; set; }

        public int? AreaId { get; set; }
        public int? CommunityId { get; set; }
    }

    public class MemberEventListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime StartsAt { get; set; }
        public DateTime? EndsAt { get; set; }
        public string? LocationText { get; set; }
        public string? MainImageUrl { get; set; }
        public string? AddressText { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? ContactPersonPhone { get; set; }
        public int? AreaId { get; set; }
        public int? CommunityId { get; set; }
        public string? CommunityName { get; set; }
        public string? AreaName { get; set; }
        public string MyRsvpStatus { get; set; } = "None";
        public int GoingCount { get; set; }
        public int MaybeCount { get; set; }
    }

    public class RsvpRequest
    {
        [Required]
        public string Status { get; set; } = "Going"; // Going | Maybe | NotGoing
    }

    public class EventAnalyticsDto
    {
        public int EventId { get; set; }
        public string Title { get; set; } = "";
        public bool IsPublished { get; set; }
        public DateTime StartsAt { get; set; }
        public int GoingCount { get; set; }
        public int MaybeCount { get; set; }
        public int NotGoingCount { get; set; }
    }
}

