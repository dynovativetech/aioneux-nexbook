using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    public class FacilityReservationDto
    {
        public int               Id              { get; set; }
        public int               FacilityId      { get; set; }
        public DateTime          ReservationDate { get; set; }
        public DateTime          StartTime       { get; set; }
        public DateTime          EndTime         { get; set; }
        public ReservationStatus Status          { get; set; }

        /// <summary>Human-readable label, e.g. "10:00 – 11:00 on 01 Apr 2026".</summary>
        public string Label =>
            $"{StartTime:HH:mm} – {EndTime:HH:mm} on {ReservationDate:dd MMM yyyy}";
    }
}
