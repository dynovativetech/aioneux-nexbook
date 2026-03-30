namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Per-tenant outbound email configuration.
    /// PK is TenantId (1-to-1 with Tenant).
    ///
    /// Each tenant can use their own domain and provider (SMTP, SendGrid, Mailgun).
    /// When no custom settings are present for a tenant, the system-level SMTP
    /// values from appsettings.json are used as a fallback.
    /// Super Admin can view and override any tenant's settings.
    /// </summary>
    public class TenantEmailSettings
    {
        /// <summary>PK and FK to Tenant — one-to-one.</summary>
        public int     TenantId              { get; set; }
        public Tenant? Tenant                { get; set; }

        /// <summary>Which email provider to use for outgoing mail.</summary>
        public EmailProvider Provider        { get; set; } = EmailProvider.Smtp;

        // ── SMTP fields (used when Provider == Smtp) ──────────────────────────
        public string? SmtpHost             { get; set; }
        public int?    SmtpPort             { get; set; }
        public string? SmtpUsername         { get; set; }

        /// <summary>Encrypted at-rest; decrypt before use.</summary>
        public string? SmtpPasswordEncrypted { get; set; }
        public bool    SmtpUseSsl           { get; set; } = true;

        // ── API-key providers (SendGrid / Mailgun) ────────────────────────────
        /// <summary>API key encrypted at-rest.</summary>
        public string? ApiKeyEncrypted      { get; set; }

        // ── Sender identity ────────────────────────────────────────────────────
        public string  FromEmail            { get; set; } = string.Empty;
        public string  FromName             { get; set; } = string.Empty;
        public string? ReplyToEmail         { get; set; }
    }
}
