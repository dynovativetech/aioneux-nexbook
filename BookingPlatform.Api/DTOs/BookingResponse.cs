using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// API response shape for all booking endpoints.
    /// Backward-compatible: existing fields are preserved; new fields are additions.
    /// </summary>
    public class BookingResponse
    {
        // ── Existing fields (backward-compatible) ────────────────────────────
        public int           Id             { get; set; }

        public int           UserId         { get; set; }
        public string        UserName       { get; set; } = string.Empty;

        public int           FacilityId     { get; set; }
        public string        FacilityName   { get; set; } = string.Empty;

        public int?          ActivityId     { get; set; }
        public string?       ActivityName   { get; set; }

        public int?          InstructorId   { get; set; }
        public string?       InstructorName { get; set; }

        public DateTime      StartTime      { get; set; }
        public DateTime      EndTime        { get; set; }
        public BookingStatus Status         { get; set; }

        // ── Venue / location ─────────────────────────────────────────────────
        public int?   VenueId       { get; set; }
        public string VenueName     { get; set; } = string.Empty;
        public string CommunityName { get; set; } = string.Empty;
        public string AreaName      { get; set; } = string.Empty;
        public string CityName      { get; set; } = string.Empty;
        public int    TenantId      { get; set; }

        // ── New fields ───────────────────────────────────────────────────────
        public BookingType   BookingType       { get; set; }
        public int           ParticipantCount  { get; set; }
        public string?       Notes             { get; set; }
        public DateTime      CreatedAt         { get; set; }
        public DateTime      UpdatedAt         { get; set; }

        /// <summary>Named participants (populated for group bookings).</summary>
        public List<BookingParticipantDto>   Participants           { get; set; } = [];

        /// <summary>One entry per reserved time slot (multiple for multi-slot bookings).</summary>
        public List<FacilityReservationDto>  FacilityReservations   { get; set; } = [];

        /// <summary>One entry per reserved instructor slot (empty if no instructor).</summary>
        public List<InstructorReservationDto> InstructorReservations { get; set; } = [];
    }
}
