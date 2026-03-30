using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    public class InstructorReservationDto
    {
        public int               Id              { get; set; }
        public int               InstructorId    { get; set; }
        public string?           InstructorName  { get; set; }
        public int               ActivityId      { get; set; }
        public DateTime          ReservationDate { get; set; }
        public DateTime          StartTime       { get; set; }
        public DateTime          EndTime         { get; set; }
        public ReservationStatus Status          { get; set; }

        public string Label =>
            $"{StartTime:HH:mm} – {EndTime:HH:mm} on {ReservationDate:dd MMM yyyy}";
    }
}
