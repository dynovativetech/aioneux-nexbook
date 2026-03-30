namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Represents an exclusive commitment of an Instructor for a specific time window.
    ///
    /// Why separate from FacilityReservation?
    ///   An instructor booking is optional (a facility can be used without one) and has
    ///   its own qualification rule: the instructor must have a matching InstructorSkill
    ///   for the chosen Activity before a reservation is accepted.
    ///   Keeping instructor locks in a dedicated table means:
    ///   1. Instructor availability can be queried without touching facility data.
    ///   2. The qualification check is co-located with the data it governs.
    ///   3. Future rules (e.g. instructor rest time, max sessions per day) can be
    ///      added without touching FacilityReservation.
    /// </summary>
    public class InstructorReservation
    {
        public int     Id              { get; set; }

        public int     BookingId       { get; set; }
        public Booking? Booking        { get; set; }

        public int        InstructorId { get; set; }
        public Instructor? Instructor  { get; set; }

        /// <summary>The Activity this reservation is for (used to record context).</summary>
        public int      ActivityId     { get; set; }
        public Activity? Activity      { get; set; }

        /// <summary>Calendar date of this reservation (UTC, time component = 00:00:00).</summary>
        public DateTime ReservationDate { get; set; }

        /// <summary>Exact start of the committed window (UTC).</summary>
        public DateTime StartTime       { get; set; }

        /// <summary>Exact end of the committed window (UTC).</summary>
        public DateTime EndTime         { get; set; }

        public ReservationStatus Status  { get; set; } = ReservationStatus.Pending;
    }
}
