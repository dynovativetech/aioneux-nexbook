namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Immutable record of every data-mutating action in the system.
    /// Answers: Who did what, to which record, and when?
    /// </summary>
    public class AuditLog
    {
        public int      Id         { get; set; }

        /// <summary>Null for SuperAdmin or system actions not scoped to a tenant.</summary>
        public int?    TenantId { get; set; }
        public Tenant? Tenant   { get; set; }

        /// <summary>UTC timestamp of the action.</summary>
        public DateTime Timestamp  { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Verb describing what happened.
        /// Allowed values: Create | Update | Delete | Login | Register | Cancel |
        ///                  StatusChange | AddComment | FailedLogin
        /// </summary>
        public string   Action     { get; set; } = string.Empty;

        /// <summary>
        /// The domain object type that was affected.
        /// e.g. Booking | Facility | Activity | Instructor | Complaint | User
        /// </summary>
        public string   EntityType { get; set; } = string.Empty;

        /// <summary>Database PK of the affected row (null for list-level actions).</summary>
        public int?     EntityId   { get; set; }

        /// <summary>Human-readable label, e.g. facility name or user email.</summary>
        public string?  EntityName { get; set; }

        /// <summary>
        /// Free-form description of what changed.
        /// e.g. "Status changed from Pending → Confirmed"
        /// </summary>
        public string?  Details    { get; set; }

        /// <summary>FK to Users. Null for unauthenticated or system actions.</summary>
        public int?     ActorId    { get; set; }

        /// <summary>Email of the actor at the time of the action.</summary>
        public string   ActorEmail { get; set; } = "system";

        /// <summary>Display name of the actor at the time of the action.</summary>
        public string   ActorName  { get; set; } = "System";

        /// <summary>Client IP address (best-effort, may be null behind a proxy).</summary>
        public string?  IpAddress  { get; set; }
    }
}
