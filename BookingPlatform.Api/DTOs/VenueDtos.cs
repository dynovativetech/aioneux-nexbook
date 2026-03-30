using System.ComponentModel.DataAnnotations;
using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    // ── Venue CRUD ────────────────────────────────────────────────────────────

    public class CreateVenueRequest
    {
        [Required, MaxLength(200)]
        public string  Name               { get; set; } = string.Empty;

        [Required]
        public int     CommunityId        { get; set; }

        public string? ShortDescription   { get; set; }
        public string? Description        { get; set; }
        public string  Address            { get; set; } = string.Empty;
        public double? Latitude           { get; set; }
        public double? Longitude          { get; set; }
        public string? GoogleMapsUrl      { get; set; }
        public string? Phone                { get; set; }
        public string? Mobile               { get; set; }
        public string? Website              { get; set; }
        public string? ContactPersonName    { get; set; }
        public string? ContactPersonEmail   { get; set; }
        public string? ContactPersonPhone   { get; set; }
        public string? ContactPersonMobile  { get; set; }
        public bool    IsActive             { get; set; } = true;
    }

    public class VenueImageResponse
    {
        public int    Id               { get; set; }
        public string FileName         { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public bool   IsPrimary        { get; set; }
        public string? Caption         { get; set; }
        public int    SortOrder        { get; set; }
        public string Url              { get; set; } = string.Empty;
    }

    public class VenueOperatingHoursDto
    {
        public int      Id        { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public string   OpenTime  { get; set; } = "08:00";
        public string   CloseTime { get; set; } = "22:00";
        public bool     IsClosed  { get; set; }
    }

    public class SetOperatingHoursRequest
    {
        [Required]
        public List<VenueOperatingHoursDto> Hours { get; set; } = [];
    }

    public class VenueAmenityDto
    {
        public int             Id          { get; set; }
        public VenueAmenityType AmenityType { get; set; }
        public bool            IsAvailable { get; set; } = true;
        public string?         Notes       { get; set; }
    }

    public class SetAmenitiesRequest
    {
        [Required]
        public List<VenueAmenityDto> Amenities { get; set; } = [];
    }

    public class AssignOrganizerRequest
    {
        [Required]
        public int     UserId        { get; set; }
        public string? FirstName     { get; set; }
        public string? LastName      { get; set; }
        public string? Email         { get; set; }
        public string? OfficialEmail { get; set; }
        public string? Phone         { get; set; }
        public string? Mobile        { get; set; }
        public string? Website       { get; set; }
    }

    public class VenueOrganizerResponse
    {
        public int     UserId        { get; set; }
        public string  UserName      { get; set; } = string.Empty;
        public string  UserEmail     { get; set; } = string.Empty;
        public string? FirstName     { get; set; }
        public string? LastName      { get; set; }
        public string? Email         { get; set; }
        public string? OfficialEmail { get; set; }
        public string? Phone         { get; set; }
        public string? Mobile        { get; set; }
        public string? Website       { get; set; }
        public DateTime AssignedAt   { get; set; }
    }

    public class VenueResponse
    {
        public int    Id                { get; set; }
        public int    CommunityId       { get; set; }
        public string CommunityName     { get; set; } = string.Empty;
        public int    TenantId          { get; set; }
        public string Name              { get; set; } = string.Empty;
        public string? ShortDescription { get; set; }
        public string? Description      { get; set; }
        public string  Address          { get; set; } = string.Empty;
        public double? Latitude         { get; set; }
        public double? Longitude        { get; set; }
        public string? GoogleMapsUrl    { get; set; }
        public string? LogoUrl          { get; set; }
        public string? CoverImageUrl    { get; set; }
        public string? Phone              { get; set; }
        public string? Mobile             { get; set; }
        public string? Website            { get; set; }
        public string? ContactPersonName   { get; set; }
        public string? ContactPersonEmail  { get; set; }
        public string? ContactPersonPhone  { get; set; }
        public string? ContactPersonMobile { get; set; }
        public bool    IsActive            { get; set; }
        public int     FacilityCount    { get; set; }
        public List<VenueImageResponse>          Images         { get; set; } = [];
        public List<VenueOperatingHoursDto>      OperatingHours { get; set; } = [];
        public List<VenueAmenityDto>             Amenities      { get; set; } = [];
        public List<VenueOrganizerResponse>      Organizers     { get; set; } = [];
    }

    public class VenueListItem
    {
        public int    Id               { get; set; }
        public string Name             { get; set; } = string.Empty;
        public string? ShortDescription { get; set; }
        public string  Address         { get; set; } = string.Empty;
        public string? CoverImageUrl   { get; set; }
        public string? LogoUrl         { get; set; }
        public string  CommunityName   { get; set; } = string.Empty;
        public bool    IsActive        { get; set; }
        public int     FacilityCount   { get; set; }
    }

    // ── Facility operating hours + slot config ────────────────────────────────

    public class FacilityOperatingHoursDto
    {
        public int      Id         { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public string   OpenTime   { get; set; } = "08:00";
        public string   CloseTime  { get; set; } = "22:00";
        public bool     IsClosed   { get; set; }
    }

    public class SetFacilityOperatingHoursRequest
    {
        [Required]
        public List<FacilityOperatingHoursDto> Hours { get; set; } = [];
    }

    public class SetSlotConfigRequest
    {
        [Range(15, 240)]
        public int SlotDurationMinutes { get; set; } = 60;

        [Range(1, 24)]
        public int MaxConsecutiveSlots { get; set; } = 3;
    }

    public class LinkActivityRequest
    {
        [Required]
        public int ActivityId { get; set; }
    }

    // ── Notification settings DTOs ────────────────────────────────────────────

    public class TenantEmailSettingsDto
    {
        public string  Provider            { get; set; } = "Smtp";
        public string? SmtpHost            { get; set; }
        public int?    SmtpPort            { get; set; }
        public string? SmtpUsername        { get; set; }
        public string? SmtpPassword        { get; set; }
        public bool    SmtpUseSsl          { get; set; } = true;
        public string? ApiKey              { get; set; }
        public string  FromEmail           { get; set; } = string.Empty;
        public string  FromName            { get; set; } = string.Empty;
        public string? ReplyToEmail        { get; set; }
    }

    public class NotificationSettingsDto
    {
        public string EventType        { get; set; } = string.Empty;
        public bool   NotifyCustomer   { get; set; } = true;
        public bool   NotifyOrganizer  { get; set; } = true;
        public bool   NotifyTenantAdmin { get; set; } = true;
    }

    public class UpdateNotificationSettingsRequest
    {
        [Required]
        public List<NotificationSettingsDto> Settings { get; set; } = [];
    }
}
