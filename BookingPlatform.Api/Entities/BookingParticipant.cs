namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Represents one participant in a group (or single) booking.
    /// For single bookings the participant is the booking owner themselves;
    /// for group bookings each additional attendee gets their own row.
    /// </summary>
    public class BookingParticipant
    {
        public int    Id        { get; set; }

        public int     BookingId { get; set; }
        public Booking? Booking  { get; set; }

        /// <summary>Full display name of the participant.</summary>
        public string  FullName  { get; set; } = string.Empty;

        /// <summary>Optional email for confirmation / notifications.</summary>
        public string? Email     { get; set; }

        /// <summary>Optional phone number for contact.</summary>
        public string? Phone     { get; set; }
    }
}
