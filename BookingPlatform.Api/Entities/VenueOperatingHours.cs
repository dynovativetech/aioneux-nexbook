namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Stores the opening and closing times for a Venue on a given day of the week.
    /// Each Venue has seven rows, one per DayOfWeek value (Sunday=0 through Saturday=6).
    /// </summary>
    public class VenueOperatingHours
    {
        public int       Id        { get; set; }
        public int       VenueId   { get; set; }
        public Venue?    Venue     { get; set; }

        /// <summary>Day of the week this row applies to (Sunday=0, Saturday=6).</summary>
        public DayOfWeek DayOfWeek { get; set; }

        /// <summary>Time the venue opens (UTC offset from midnight).</summary>
        public TimeSpan  OpenTime  { get; set; }

        /// <summary>Time the venue closes (UTC offset from midnight).</summary>
        public TimeSpan  CloseTime { get; set; }

        /// <summary>When true, the venue is closed on this day regardless of Open/Close times.</summary>
        public bool      IsClosed  { get; set; }
    }
}
