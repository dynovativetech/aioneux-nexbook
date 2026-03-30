namespace BookingPlatform.Api.DTOs
{
    public class TimeSlot
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime   { get; set; }

        /// <summary>Human-readable label, e.g. "10:00 – 11:00"</summary>
        public string Label =>
            $"{StartTime:HH:mm} – {EndTime:HH:mm}";
    }
}
