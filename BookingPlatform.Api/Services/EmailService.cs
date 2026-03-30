namespace BookingPlatform.Api.Services
{
    /// <summary>
    /// System-level email service that uses SMTP settings from appsettings.json.
    /// Used as the fallback when a tenant has no custom TenantEmailSettings configured.
    /// Registered as Singleton; all tenant-aware email dispatch happens in NotificationService.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration        _config;

        public EmailService(ILogger<EmailService> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        public async Task<bool> SendAsync(string toEmail, string toName, string subject, string htmlBody)
        {
            var smtpHost = _config["Email:SmtpHost"];
            if (string.IsNullOrWhiteSpace(smtpHost))
            {
                _logger.LogInformation(
                    "[EmailService] SMTP not configured — email to {Email} (subject: {Subject}) was not sent.",
                    toEmail, subject);
                return false;
            }

            try
            {
                var port     = int.Parse(_config["Email:SmtpPort"] ?? "587");
                var user     = _config["Email:Username"] ?? string.Empty;
                var password = _config["Email:Password"] ?? string.Empty;
                var from     = _config["Email:FromAddress"] ?? user;
                var fromName = _config["Email:FromName"] ?? "NexBook Platform";

                using var client = new System.Net.Mail.SmtpClient(smtpHost, port)
                {
                    Credentials = new System.Net.NetworkCredential(user, password),
                    EnableSsl   = true
                };

                var msg = new System.Net.Mail.MailMessage(
                    new System.Net.Mail.MailAddress(from, fromName),
                    new System.Net.Mail.MailAddress(toEmail, toName))
                {
                    Subject    = subject,
                    Body       = htmlBody,
                    IsBodyHtml = true
                };

                await client.SendMailAsync(msg);
                _logger.LogInformation("[EmailService] Email sent to {Email}: {Subject}", toEmail, subject);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EmailService] Failed to send email to {Email}: {Subject}", toEmail, subject);
                return false;
            }
        }

        public async Task SendWelcomeEmailAsync(
            string toEmail,
            string toName,
            string tenantName,
            string loginUrl,
            string tempPassword)
        {
            var body = EmailTemplateEngine.WelcomeAdmin(toName, tenantName,
                string.IsNullOrWhiteSpace(loginUrl) ? "https://app.nexbook.app" : loginUrl,
                tempPassword);

            await SendAsync(toEmail, toName, $"Welcome to NexBook — {tenantName}", body);
        }
    }
}
