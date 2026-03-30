namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Operating hours for a Facility on a specific day of the week.
    /// Each Facility has up to seven rows (one per DayOfWeek).
    ///
    /// Slot count derived at runtime:
    ///   DailySlotCount = (CloseTime - OpenTime).TotalMinutes / Facility.SlotDurationMinutes
    /// </summary>
    public class FacilityOperatingHours
    {
        public int       Id         { get; set; }
        public int       FacilityId { get; set; }
        public Facility? Facility   { get; set; }

        /// <summary>Day of the week (Sunday=0, Saturday=6).</summary>
        public DayOfWeek DayOfWeek  { get; set; }

        public TimeSpan  OpenTime   { get; set; }
        public TimeSpan  CloseTime  { get; set; }

        /// <summary>When true, the facility is closed on this day (Open/Close times ignored).</summary>
        public bool      IsClosed   { get; set; }
    }
}
