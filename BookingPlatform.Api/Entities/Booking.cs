namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Root aggregate for a booking.
    ///
    /// Design notes
    /// ─────────────
    /// • StartTime / EndTime hold the summary window:
    ///     - Single / Group  → equal to the one slot's start/end.
    ///     - MultiSlot       → earliest FacilityReservation.StartTime /
    ///                         latest  FacilityReservation.EndTime.
    ///   The per-slot detail lives in FacilityReservation / InstructorReservation.
    ///
    /// • BookingGroupId is null for every booking type.
    ///   Multi-slot is modelled as ONE Booking with MANY child reservation rows,
    ///   so a group ID is not needed on the booking itself.
    ///
    /// • FacilityReservation and InstructorReservation are separate child tables
    ///   (see comments on those entities) so that each resource can be locked and
    ///   queried independently.
    /// </summary>
    public class Booking
    {
        public int Id { get; set; }

        // ── Multi-tenancy ────────────────────────────────────────────────────
        public int     TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        // ── Core references ─────────────────────────────────────────────────
        public int   UserId       { get; set; }
        public User? User         { get; set; }

        public int      FacilityId   { get; set; }
        public Facility? Facility    { get; set; }

        public int      ActivityId   { get; set; }
        public Activity? Activity    { get; set; }

        /// <summary>Null when no instructor is required for this booking.</summary>
        public int?        InstructorId { get; set; }
        public Instructor? Instructor   { get; set; }

        // ── Booking classification ───────────────────────────────────────────
        public BookingType BookingType { get; set; } = BookingType.Single;

        // ── Time window (summary) ────────────────────────────────────────────
        public DateTime StartTime { get; set; }
        public DateTime EndTime   { get; set; }

        // ── Capacity / participants ──────────────────────────────────────────
        /// <summary>Total number of participants. Must be ≥ 1. Must not exceed Facility.Capacity.</summary>
        public int ParticipantCount { get; set; } = 1;

        /// <summary>Optional free-text notes from the customer.</summary>
        public string? Notes { get; set; }

        // ── Status / audit ───────────────────────────────────────────────────
        public BookingStatus Status    { get; set; } = BookingStatus.Pending;
        public DateTime      CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime      UpdatedAt { get; set; } = DateTime.UtcNow;

        // ── Child collections ────────────────────────────────────────────────
        public ICollection<Complaint>             Complaints            { get; set; } = [];
        public ICollection<BookingParticipant>    Participants          { get; set; } = [];

        /// <summary>
        /// One row per reserved time slot for the facility.
        /// Single/Group → 1 row.  MultiSlot → one row per slot.
        /// </summary>
        public ICollection<FacilityReservation>   FacilityReservations  { get; set; } = [];

        /// <summary>
        /// One row per reserved time slot for the instructor (empty if no instructor).
        /// </summary>
        public ICollection<InstructorReservation> InstructorReservations { get; set; } = [];
    }
}
