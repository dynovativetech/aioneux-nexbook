namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// A single open time slot returned by GetAvailableFacilitySlotsAsync
    /// or GetAvailableInstructorSlotsAsync.
    /// </summary>
    public class AvailableSlotDto
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime   { get; set; }

        /// <summary>Duration of the slot in minutes.</summary>
        public int DurationMinutes =>
            (int)(EndTime - StartTime).TotalMinutes;

        /// <summary>Human-readable label, e.g. "10:00 – 11:00".</summary>
        public string Label =>
            $"{StartTime:HH:mm} – {EndTime:HH:mm}";
    }

    /// <summary>Response envelope returned by both availability endpoints.</summary>
    public class ResourceAvailabilityResponse
    {
        public int    ResourceId         { get; set; }
        public string ResourceName       { get; set; } = string.Empty;
        public string ResourceType       { get; set; } = string.Empty; // "Facility" | "Instructor"
        public DateTime Date             { get; set; }
        public int    SlotDurationMinutes { get; set; }
        public int    TotalSlots         { get; set; }
        public int    AvailableSlotCount { get; set; }
        public int    BookedSlotCount    { get; set; }
        public List<AvailableSlotDto> AvailableSlots { get; set; } = [];
    }
}
