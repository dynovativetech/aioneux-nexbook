namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Represents an exclusive lock on a Facility for a specific time window.
    ///
    /// Why a separate table from Booking?
    ///   A single Booking (especially a MultiSlot booking) can require the same
    ///   facility at multiple, non-contiguous times. By storing each time window
    ///   as an independent row in this table, overlap detection becomes a simple
    ///   date-range query against one table, regardless of booking type.
    ///   It also lets facility availability and instructor availability be queried
    ///   independently, since they follow different business rules.
    ///
    /// Overlap detection rule:
    ///   Two reservations overlap when:
    ///       existingStart &lt; newEnd  AND  existingEnd &gt; newStart
    ///   This standard Allen's interval-overlap test is used throughout the service.
    /// </summary>
    public class FacilityReservation
    {
        public int    Id              { get; set; }

        public int     BookingId       { get; set; }
        public Booking? Booking        { get; set; }

        public int      FacilityId     { get; set; }
        public Facility? Facility      { get; set; }

        /// <summary>Calendar date of this reservation (UTC, time component = 00:00:00).</summary>
        public DateTime ReservationDate { get; set; }

        /// <summary>Exact start of the reserved window (UTC).</summary>
        public DateTime StartTime       { get; set; }

        /// <summary>Exact end of the reserved window (UTC).</summary>
        public DateTime EndTime         { get; set; }

        public ReservationStatus Status  { get; set; } = ReservationStatus.Pending;
    }
}
