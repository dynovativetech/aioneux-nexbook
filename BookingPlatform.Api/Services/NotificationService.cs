using BookingPlatform.Api.Data;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    /// <summary>
    /// Resolves which recipients should be notified (from TenantNotificationSettings),
    /// builds email bodies via EmailTemplateEngine, dispatches via the correct email
    /// sender (tenant SMTP/SendGrid or system fallback), and logs every attempt.
    ///
    /// Design decisions:
    /// - Registered as Scoped (needs DbContext).
    /// - Never throws — all failures are caught, logged, and written to NotificationLog.
    /// - Per-tenant email settings (TenantEmailSettings) override the system IEmailService.
    /// - If no tenant email settings exist, the injected IEmailService (system SMTP) is used.
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext          _db;
        private readonly IEmailService         _systemEmail;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            AppDbContext db,
            IEmailService systemEmail,
            ILogger<NotificationService> logger)
        {
            _db          = db;
            _systemEmail = systemEmail;
            _logger      = logger;
        }

        // ════════════════════════════════════════════════════════════════════
        // Booking events
        // ════════════════════════════════════════════════════════════════════

        public async Task NotifyBookingCreatedAsync(int bookingId)
        {
            try
            {
                var booking = await LoadBookingAsync(bookingId);
                if (booking is null) return;

                var settings = await GetNotificationSettingsAsync(booking.TenantId, NotificationEventType.BookingCreated);
                var isPending = booking.Status == BookingStatus.Pending;

                if (settings.NotifyCustomer && booking.User is not null)
                {
                    var body = EmailTemplateEngine.BookingCreatedCustomer(
                        booking.User.FullName,
                        booking.Facility?.Venue?.Name ?? booking.Facility?.Name ?? "Venue",
                        booking.Facility?.Name ?? "Facility",
                        booking.Activity?.Name ?? "",
                        booking.StartTime.Date, booking.StartTime, booking.EndTime,
                        booking.ParticipantCount, booking.Id.ToString(), isPending);

                    await SendAndLogAsync(booking.TenantId, bookingId, NotificationEventType.BookingCreated,
                        booking.User.Email, booking.User.FullName, Roles.Customer,
                        $"Booking {(isPending ? "Received" : "Confirmed")} — Ref #{booking.Id}", body);
                }

                if (settings.NotifyOrganizer)
                    await NotifyOrganizersAsync(booking, NotificationEventType.BookingCreated,
                        (orgName) => EmailTemplateEngine.BookingCreatedOrganizer(
                            orgName,
                            booking.User?.FullName ?? "Customer",
                            booking.User?.Email ?? "",
                            booking.Facility?.Name ?? "Facility",
                            booking.Activity?.Name ?? "",
                            booking.StartTime.Date, booking.StartTime, booking.EndTime,
                            booking.ParticipantCount, booking.Id.ToString()));

                if (settings.NotifyTenantAdmin)
                    await NotifyTenantAdminAsync(booking, NotificationEventType.BookingCreated,
                        (adminName) => EmailTemplateEngine.BookingCreatedAdmin(
                            adminName,
                            booking.User?.FullName ?? "Customer",
                            booking.Facility?.Venue?.Name ?? "Venue",
                            booking.Facility?.Name ?? "Facility",
                            booking.Activity?.Name ?? "",
                            booking.StartTime.Date, booking.StartTime, booking.EndTime,
                            booking.Id.ToString()),
                        $"New Booking Alert — Ref #{booking.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyBookingCreatedAsync({BookingId})", bookingId);
            }
        }

        public async Task NotifyBookingConfirmedAsync(int bookingId)
        {
            try
            {
                var booking = await LoadBookingAsync(bookingId);
                if (booking is null) return;

                var settings = await GetNotificationSettingsAsync(booking.TenantId, NotificationEventType.BookingConfirmed);

                if (settings.NotifyCustomer && booking.User is not null)
                {
                    var body = EmailTemplateEngine.BookingConfirmed(
                        booking.User.FullName,
                        booking.Facility?.Venue?.Name ?? booking.Facility?.Name ?? "Venue",
                        booking.Facility?.Name ?? "Facility",
                        booking.Activity?.Name ?? "",
                        booking.StartTime.Date, booking.StartTime, booking.EndTime,
                        booking.ParticipantCount, booking.Id.ToString());

                    await SendAndLogAsync(booking.TenantId, bookingId, NotificationEventType.BookingConfirmed,
                        booking.User.Email, booking.User.FullName, Roles.Customer,
                        $"Booking Confirmed — Ref #{booking.Id}", body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyBookingConfirmedAsync({BookingId})", bookingId);
            }
        }

        public async Task NotifyBookingRejectedAsync(int bookingId, string reason)
        {
            try
            {
                var booking = await LoadBookingAsync(bookingId);
                if (booking is null) return;

                var settings = await GetNotificationSettingsAsync(booking.TenantId, NotificationEventType.BookingRejected);

                if (settings.NotifyCustomer && booking.User is not null)
                {
                    var body = EmailTemplateEngine.BookingRejected(
                        booking.User.FullName,
                        booking.Facility?.Venue?.Name ?? booking.Facility?.Name ?? "Venue",
                        booking.Facility?.Name ?? "Facility",
                        booking.StartTime.Date, booking.StartTime, booking.EndTime,
                        booking.Id.ToString(), reason);

                    await SendAndLogAsync(booking.TenantId, bookingId, NotificationEventType.BookingRejected,
                        booking.User.Email, booking.User.FullName, Roles.Customer,
                        $"Booking Update — Ref #{booking.Id}", body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyBookingRejectedAsync({BookingId})", bookingId);
            }
        }

        public async Task NotifyBookingCancelledAsync(int bookingId)
        {
            try
            {
                var booking = await LoadBookingAsync(bookingId);
                if (booking is null) return;

                var settings = await GetNotificationSettingsAsync(booking.TenantId, NotificationEventType.BookingCancelled);

                if (settings.NotifyCustomer && booking.User is not null)
                {
                    var body = EmailTemplateEngine.BookingCancelledCustomer(
                        booking.User.FullName,
                        booking.Facility?.Venue?.Name ?? booking.Facility?.Name ?? "Venue",
                        booking.Facility?.Name ?? "Facility",
                        booking.StartTime.Date, booking.StartTime, booking.EndTime,
                        booking.Id.ToString());

                    await SendAndLogAsync(booking.TenantId, bookingId, NotificationEventType.BookingCancelled,
                        booking.User.Email, booking.User.FullName, Roles.Customer,
                        $"Booking Cancelled — Ref #{booking.Id}", body);
                }

                if (settings.NotifyOrganizer)
                    await NotifyOrganizersAsync(booking, NotificationEventType.BookingCancelled,
                        (orgName) => EmailTemplateEngine.BookingCancelledOrganizer(
                            orgName,
                            booking.User?.FullName ?? "Customer",
                            booking.Facility?.Name ?? "Facility",
                            booking.StartTime.Date, booking.StartTime, booking.EndTime,
                            booking.Id.ToString()));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyBookingCancelledAsync({BookingId})", bookingId);
            }
        }

        // ════════════════════════════════════════════════════════════════════
        // Complaint events
        // ════════════════════════════════════════════════════════════════════

        public async Task NotifyComplaintCreatedAsync(int complaintId)
        {
            try
            {
                var complaint = await _db.Complaints
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == complaintId);

                if (complaint?.User is null) return;

                var settings = await GetNotificationSettingsAsync(complaint.TenantId, NotificationEventType.ComplaintCreated);

                if (settings.NotifyCustomer)
                {
                    var body = EmailTemplateEngine.ComplaintCreatedCustomer(
                        complaint.User.FullName, complaint.Title, complaint.Id.ToString());

                    await SendAndLogAsync(complaint.TenantId, null, NotificationEventType.ComplaintCreated,
                        complaint.User.Email, complaint.User.FullName, Roles.Customer,
                        $"Complaint Received — Ref #{complaint.Id}", body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyComplaintCreatedAsync({Id})", complaintId);
            }
        }

        public async Task NotifyComplaintStatusChangedAsync(int complaintId)
        {
            try
            {
                var complaint = await _db.Complaints
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == complaintId);

                if (complaint?.User is null) return;

                var settings = await GetNotificationSettingsAsync(complaint.TenantId, NotificationEventType.ComplaintStatusChanged);

                if (settings.NotifyCustomer)
                {
                    var body = EmailTemplateEngine.ComplaintStatusChanged(
                        complaint.User.FullName, complaint.Title,
                        complaint.Status.ToString(), complaint.Id.ToString());

                    await SendAndLogAsync(complaint.TenantId, null, NotificationEventType.ComplaintStatusChanged,
                        complaint.User.Email, complaint.User.FullName, Roles.Customer,
                        $"Complaint Update — Ref #{complaint.Id}", body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyComplaintStatusChangedAsync({Id})", complaintId);
            }
        }

        // ════════════════════════════════════════════════════════════════════
        // Welcome events
        // ════════════════════════════════════════════════════════════════════

        public async Task NotifyWelcomeCustomerAsync(int userId)
        {
            try
            {
                var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                if (user is null) return;

                var body = EmailTemplateEngine.WelcomeCustomer(user.FullName, "https://app.nexbook.app/login");
                await SendAndLogAsync(user.TenantId ?? 0, null, NotificationEventType.WelcomeCustomer,
                    user.Email, user.FullName, Roles.Customer,
                    "Welcome to NexBook!", body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyWelcomeCustomerAsync({UserId})", userId);
            }
        }

        public async Task NotifyWelcomeOrganizerAsync(int userId, int venueId, string tempPassword)
        {
            try
            {
                var user  = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                var venue = await _db.Venues.AsNoTracking().FirstOrDefaultAsync(v => v.Id == venueId);
                if (user is null || venue is null) return;

                var loginUrl = "https://app.nexbook.app/organizer/login";
                var body = EmailTemplateEngine.WelcomeOrganizer(user.FullName, venue.Name, loginUrl, tempPassword);

                await SendAndLogAsync(venue.TenantId, null, NotificationEventType.WelcomeOrganizer,
                    user.Email, user.FullName, Roles.FacilityOrganizer,
                    $"You've been assigned as organizer for {venue.Name}", body);

                // Also notify tenant admin
                var tenantAdmin = await _db.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.TenantId == venue.TenantId && u.Role == Roles.TenantAdmin);

                if (tenantAdmin is not null)
                {
                    var adminBody = $"<p>Hi {tenantAdmin.FullName},</p>" +
                                    $"<p>Organizer <strong>{user.FullName}</strong> ({user.Email}) has been assigned to <strong>{venue.Name}</strong>.</p>";
                    await SendAndLogAsync(venue.TenantId, null, NotificationEventType.WelcomeOrganizer,
                        tenantAdmin.Email, tenantAdmin.FullName, Roles.TenantAdmin,
                        $"New Organizer Assigned — {venue.Name}", adminBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Error in NotifyWelcomeOrganizerAsync({UserId})", userId);
            }
        }

        // ════════════════════════════════════════════════════════════════════
        // Private helpers
        // ════════════════════════════════════════════════════════════════════

        private async Task<Entities.Booking?> LoadBookingAsync(int bookingId) =>
            await _db.Bookings
                .Include(b => b.User)
                .Include(b => b.Facility).ThenInclude(f => f!.Venue)
                .Include(b => b.Activity)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == bookingId);

        /// <summary>
        /// Returns the notification settings for a given tenant and event type.
        /// Falls back to all-true defaults if no settings row exists for this event.
        /// </summary>
        private async Task<(bool NotifyCustomer, bool NotifyOrganizer, bool NotifyTenantAdmin)>
            GetNotificationSettingsAsync(int tenantId, NotificationEventType eventType)
        {
            var row = await _db.TenantNotificationSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.EventType == eventType);

            return row is null
                ? (true, true, true)
                : (row.NotifyCustomer, row.NotifyOrganizer, row.NotifyTenantAdmin);
        }

        /// <summary>Sends to all organizers assigned to the booking's venue.</summary>
        private async Task NotifyOrganizersAsync(
            Entities.Booking booking,
            NotificationEventType eventType,
            Func<string, string> buildBody)
        {
            if (booking.Facility?.VenueId is null) return;

            var organizers = await _db.VenueOrganizers
                .Include(vo => vo.User)
                .Where(vo => vo.VenueId == booking.Facility.VenueId)
                .AsNoTracking()
                .ToListAsync();

            foreach (var org in organizers.Where(o => o.User is not null))
            {
                var displayName = $"{org.FirstName} {org.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(displayName)) displayName = org.User!.FullName;

                var body = buildBody(displayName);
                await SendAndLogAsync(booking.TenantId, booking.Id, eventType,
                    org.User!.Email, displayName, Roles.FacilityOrganizer,
                    $"Booking Update — Ref #{booking.Id}", body);
            }
        }

        /// <summary>Sends to the first TenantAdmin for the booking's tenant.</summary>
        private async Task NotifyTenantAdminAsync(
            Entities.Booking booking,
            NotificationEventType eventType,
            Func<string, string> buildBody,
            string subject)
        {
            var admin = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.TenantId == booking.TenantId && u.Role == Roles.TenantAdmin);

            if (admin is null) return;

            var body = buildBody(admin.FullName);
            await SendAndLogAsync(booking.TenantId, booking.Id, eventType,
                admin.Email, admin.FullName, Roles.TenantAdmin, subject, body);
        }

        /// <summary>
        /// Resolves the correct email sender for a tenant (tenant settings > system fallback),
        /// dispatches the email, and writes a NotificationLog row regardless of outcome.
        /// </summary>
        private async Task SendAndLogAsync(
            int tenantId,
            int? bookingId,
            NotificationEventType eventType,
            string toEmail,
            string toName,
            string recipientRole,
            string subject,
            string htmlBody)
        {
            bool   sent  = false;
            string? error = null;

            try
            {
                var sender = await ResolveSenderAsync(tenantId);
                sent = await sender(toEmail, toName, subject, htmlBody);
            }
            catch (Exception ex)
            {
                error = ex.Message;
                _logger.LogError(ex, "[NotificationService] Failed to send '{Subject}' to {Email}", subject, toEmail);
            }

            // Always log the attempt regardless of success/failure
            _db.NotificationLogs.Add(new NotificationLog
            {
                TenantId      = tenantId,
                BookingId     = bookingId,
                EventType     = eventType,
                Event         = eventType.ToString(),
                Type          = "Email",
                RecipientEmail = toEmail,
                RecipientRole = recipientRole,
                Subject       = subject,
                Body          = htmlBody,
                IsSent        = sent,
                SentAt        = sent ? DateTime.UtcNow : null,
                ErrorMessage  = error,
                CreatedAt     = DateTime.UtcNow
            });

            try { await _db.SaveChangesAsync(); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationService] Failed to save NotificationLog for {Email}", toEmail);
            }
        }

        /// <summary>
        /// Returns the correct send function for the given tenant.
        /// If the tenant has custom TenantEmailSettings, a dedicated SmtpClient or
        /// SendGrid HTTP call is built from those settings.
        /// Otherwise, the system IEmailService (SMTP from appsettings) is used.
        /// </summary>
        private async Task<Func<string, string, string, string, Task<bool>>> ResolveSenderAsync(int tenantId)
        {
            if (tenantId == 0)
                return (to, name, sub, body) => _systemEmail.SendAsync(to, name, sub, body);

            var settings = await _db.TenantEmailSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.TenantId == tenantId);

            if (settings is null)
                return (to, name, sub, body) => _systemEmail.SendAsync(to, name, sub, body);

            return settings.Provider switch
            {
                EmailProvider.SendGrid => BuildSendGridSender(settings),
                EmailProvider.Mailgun  => BuildMailgunSender(settings),
                _                      => BuildSmtpSender(settings)
            };
        }

        private Func<string, string, string, string, Task<bool>> BuildSmtpSender(TenantEmailSettings s) =>
            async (toEmail, toName, subject, htmlBody) =>
            {
                if (string.IsNullOrWhiteSpace(s.SmtpHost)) return false;

                try
                {
                    using var client = new System.Net.Mail.SmtpClient(s.SmtpHost, s.SmtpPort ?? 587)
                    {
                        Credentials = new System.Net.NetworkCredential(s.SmtpUsername, s.SmtpPasswordEncrypted),
                        EnableSsl   = s.SmtpUseSsl
                    };
                    var msg = new System.Net.Mail.MailMessage(
                        new System.Net.Mail.MailAddress(s.FromEmail, s.FromName),
                        new System.Net.Mail.MailAddress(toEmail, toName))
                    { Subject = subject, Body = htmlBody, IsBodyHtml = true };

                    if (!string.IsNullOrWhiteSpace(s.ReplyToEmail))
                        msg.ReplyToList.Add(new System.Net.Mail.MailAddress(s.ReplyToEmail));

                    await client.SendMailAsync(msg);
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[NotificationService] Tenant SMTP failed for {Email}", toEmail);
                    return false;
                }
            };

        /// <summary>Sends via SendGrid v3 Mail Send API using raw HttpClient (no SDK dependency).</summary>
        private Func<string, string, string, string, Task<bool>> BuildSendGridSender(TenantEmailSettings s) =>
            async (toEmail, toName, subject, htmlBody) =>
            {
                if (string.IsNullOrWhiteSpace(s.ApiKeyEncrypted)) return false;

                try
                {
                    using var http = new System.Net.Http.HttpClient();
                    http.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", s.ApiKeyEncrypted);

                    var payload = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        personalizations = new[] { new { to = new[] { new { email = toEmail, name = toName } } } },
                        from             = new { email = s.FromEmail, name = s.FromName },
                        subject,
                        content          = new[] { new { type = "text/html", value = htmlBody } }
                    });

                    var response = await http.PostAsync(
                        "https://api.sendgrid.com/v3/mail/send",
                        new System.Net.Http.StringContent(payload, System.Text.Encoding.UTF8, "application/json"));

                    if (!response.IsSuccessStatusCode)
                        _logger.LogWarning("[NotificationService] SendGrid returned {Status} for {Email}", response.StatusCode, toEmail);

                    return response.IsSuccessStatusCode;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[NotificationService] SendGrid send failed for {Email}", toEmail);
                    return false;
                }
            };

        private Func<string, string, string, string, Task<bool>> BuildMailgunSender(TenantEmailSettings s) =>
            async (toEmail, toName, subject, htmlBody) =>
            {
                if (string.IsNullOrWhiteSpace(s.ApiKeyEncrypted) || string.IsNullOrWhiteSpace(s.SmtpHost))
                    return false;

                try
                {
                    using var http = new System.Net.Http.HttpClient();
                    var content = new System.Net.Http.FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["from"]    = $"{s.FromName} <{s.FromEmail}>",
                        ["to"]      = $"{toName} <{toEmail}>",
                        ["subject"] = subject,
                        ["html"]    = htmlBody
                    });

                    // SmtpHost used to store the Mailgun domain (e.g. "mg.yourdomain.com")
                    var url = $"https://api.mailgun.net/v3/{s.SmtpHost}/messages";
                    var creds = System.Convert.ToBase64String(
                        System.Text.Encoding.ASCII.GetBytes($"api:{s.ApiKeyEncrypted}"));
                    http.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", creds);

                    var response = await http.PostAsync(url, content);
                    return response.IsSuccessStatusCode;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[NotificationService] Mailgun send failed for {Email}", toEmail);
                    return false;
                }
            };
    }
}
