namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Per-tenant, per-event toggle controlling which recipients receive email notifications.
    /// Each row represents one event type for one tenant.
    /// All three recipient flags default to true — Tenant Admin can turn them off per event.
    /// Unique constraint on (TenantId, EventType).
    /// </summary>
    public class TenantNotificationSettings
    {
        public int                   Id               { get; set; }
        public int                   TenantId         { get; set; }
        public Tenant?               Tenant           { get; set; }

        public NotificationEventType EventType        { get; set; }

        /// <summary>Send email to the booking customer for this event.</summary>
        public bool                  NotifyCustomer   { get; set; } = true;

        /// <summary>Send email to the venue organizer for this event.</summary>
        public bool                  NotifyOrganizer  { get; set; } = true;

        /// <summary>Send email to the tenant admin for this event.</summary>
        public bool                  NotifyTenantAdmin { get; set; } = true;
    }
}
