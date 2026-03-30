namespace BookingPlatform.Api.Services
{
    /// <summary>
    /// Low-level email dispatch interface.
    /// The default implementation (EmailService) uses system SMTP from appsettings.json.
    /// Per-tenant SMTP/SendGrid settings are resolved by NotificationService at runtime.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>Sends a single HTML email. Returns true on success.</summary>
        Task<bool> SendAsync(string toEmail, string toName, string subject, string htmlBody);

        // Kept for backward compatibility — used by TenantService for welcome emails.
        Task SendWelcomeEmailAsync(
            string toEmail,
            string toName,
            string tenantName,
            string loginUrl,
            string tempPassword);
    }
}
