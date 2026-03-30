namespace BookingPlatform.Api.Entities
{
    public class NotificationLog
    {
        public int      Id             { get; set; }
        public int      TenantId       { get; set; }
        public Tenant?  Tenant         { get; set; }
        public int?     BookingId      { get; set; }
        public Booking? Booking        { get; set; }

        /// <summary>Typed event that triggered this notification.</summary>
        public NotificationEventType EventType      { get; set; }

        /// <summary>Legacy string event name — kept for backward compatibility.</summary>
        public string   Event          { get; set; } = string.Empty;

        /// <summary>Delivery channel, e.g. "Email".</summary>
        public string   Type           { get; set; } = string.Empty;

        public string   RecipientEmail { get; set; } = string.Empty;

        /// <summary>Role of the recipient: Customer, FacilityOrganizer, TenantAdmin, SuperAdmin.</summary>
        public string?  RecipientRole  { get; set; }

        public string   Subject        { get; set; } = string.Empty;

        /// <summary>Full HTML body of the sent email (stored for audit/resend purposes).</summary>
        public string?  Body           { get; set; }

        public bool     IsSent         { get; set; }

        /// <summary>UTC timestamp when the email was actually dispatched. Null if not yet sent.</summary>
        public DateTime? SentAt        { get; set; }

        /// <summary>Error message if delivery failed.</summary>
        public string?  ErrorMessage   { get; set; }

        public DateTime CreatedAt      { get; set; } = DateTime.UtcNow;
    }
}
