namespace BookingPlatform.Api.DTOs
{
    public class AvailabilityResponse
    {
        public int    FacilityId   { get; set; }
        public string FacilityName { get; set; } = string.Empty;

        public DateTime Date                { get; set; }
        public int      SlotDurationMinutes { get; set; }

        public int? InstructorId   { get; set; }
        public string? InstructorName { get; set; }

        public int TotalSlots         { get; set; }
        public int AvailableSlotCount { get; set; }
        public int BookedSlotCount    { get; set; }

        public List<TimeSlot> AvailableSlots { get; set; } = new();
    }
}
