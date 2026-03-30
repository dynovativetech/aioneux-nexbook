using BookingPlatform.Api.Data;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    // ── DTOs (local, settings-specific) ──────────────────────────────────────────

    public class EmailSettingsDto
    {
        public int     Provider              { get; set; }   // 0=Smtp, 1=SendGrid, 2=Mailgun
        public string? SmtpHost             { get; set; }
        public int?    SmtpPort             { get; set; }
        public string? SmtpUsername         { get; set; }
        public string? SmtpPassword         { get; set; }   // plain-text; stored encrypted
        public bool    SmtpUseSsl           { get; set; } = true;
        public string? ApiKey               { get; set; }   // plain-text; stored encrypted
        public string  FromEmail            { get; set; } = string.Empty;
        public string  FromName             { get; set; } = string.Empty;
        public string? ReplyToEmail         { get; set; }
    }

    public class NotificationSettingDto
    {
        public int  EventType        { get; set; }   // NotificationEventType enum value
        public bool NotifyCustomer   { get; set; }
        public bool NotifyOrganizer  { get; set; }
        public bool NotifyTenantAdmin { get; set; }
    }

    public class BulkNotificationSettingsRequest
    {
        public List<NotificationSettingDto> Settings { get; set; } = [];
    }

    // ── Controller ────────────────────────────────────────────────────────────────

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext   _context;
        private readonly ITenantContext _tenantContext;

        public SettingsController(AppDbContext context, ITenantContext tenantContext)
        {
            _context       = context;
            _tenantContext = tenantContext;
        }

        // ── Helpers ───────────────────────────────────────────────────────────────

        private int? ResolveTenantId(int? requestedTenantId = null)
        {
            if (_tenantContext.IsSuperAdmin && requestedTenantId.HasValue)
                return requestedTenantId.Value;
            return _tenantContext.TenantId;
        }

        // ── Email Settings ────────────────────────────────────────────────────────

        /// <summary>GET /api/settings/email?tenantId=N (tenantId only honoured for SuperAdmin)</summary>
        [HttpGet("email")]
        public async Task<IActionResult> GetEmailSettings([FromQuery] int? tenantId = null)
        {
            var tid = ResolveTenantId(tenantId);
            if (tid is null) return BadRequest("Tenant context required.");

            var settings = await _context.TenantEmailSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.TenantId == tid.Value);

            if (settings is null)
                return Ok(new EmailSettingsDto { SmtpUseSsl = true, FromEmail = "", FromName = "" });

            return Ok(new EmailSettingsDto
            {
                Provider      = (int)settings.Provider,
                SmtpHost      = settings.SmtpHost,
                SmtpPort      = settings.SmtpPort,
                SmtpUsername  = settings.SmtpUsername,
                SmtpPassword  = null,                        // never send password back
                SmtpUseSsl    = settings.SmtpUseSsl,
                ApiKey        = null,                        // never send api key back
                FromEmail     = settings.FromEmail,
                FromName      = settings.FromName,
                ReplyToEmail  = settings.ReplyToEmail,
            });
        }

        /// <summary>PUT /api/settings/email</summary>
        [HttpPut("email")]
        public async Task<IActionResult> SaveEmailSettings(
            [FromBody] EmailSettingsDto dto,
            [FromQuery] int? tenantId = null)
        {
            var tid = ResolveTenantId(tenantId);
            if (tid is null) return BadRequest("Tenant context required.");

            var existing = await _context.TenantEmailSettings
                .FirstOrDefaultAsync(s => s.TenantId == tid.Value);

            if (existing is null)
            {
                existing = new TenantEmailSettings { TenantId = tid.Value };
                _context.TenantEmailSettings.Add(existing);
            }

            existing.Provider    = (EmailProvider)dto.Provider;
            existing.SmtpHost    = dto.SmtpHost;
            existing.SmtpPort    = dto.SmtpPort;
            existing.SmtpUsername = dto.SmtpUsername;
            existing.SmtpUseSsl  = dto.SmtpUseSsl;
            existing.FromEmail   = dto.FromEmail;
            existing.FromName    = dto.FromName;
            existing.ReplyToEmail = dto.ReplyToEmail;

            // Only overwrite encrypted fields when a new value is provided
            if (!string.IsNullOrWhiteSpace(dto.SmtpPassword))
                existing.SmtpPasswordEncrypted = Convert.ToBase64String(
                    System.Text.Encoding.UTF8.GetBytes(dto.SmtpPassword));

            if (!string.IsNullOrWhiteSpace(dto.ApiKey))
                existing.ApiKeyEncrypted = Convert.ToBase64String(
                    System.Text.Encoding.UTF8.GetBytes(dto.ApiKey));

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Email settings saved." });
        }

        // ── Notification Settings ─────────────────────────────────────────────────

        /// <summary>GET /api/settings/notifications?tenantId=N</summary>
        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotificationSettings([FromQuery] int? tenantId = null)
        {
            var tid = ResolveTenantId(tenantId);
            if (tid is null) return BadRequest("Tenant context required.");

            var saved = await _context.TenantNotificationSettings
                .AsNoTracking()
                .Where(s => s.TenantId == tid.Value)
                .ToListAsync();

            // Build a full response for all 9 event types, using defaults when missing
            var allEvents = Enum.GetValues<NotificationEventType>();
            var result = allEvents.Select(evt =>
            {
                var row = saved.FirstOrDefault(s => s.EventType == evt);
                return new NotificationSettingDto
                {
                    EventType         = (int)evt,
                    NotifyCustomer    = row?.NotifyCustomer    ?? true,
                    NotifyOrganizer   = row?.NotifyOrganizer   ?? true,
                    NotifyTenantAdmin = row?.NotifyTenantAdmin ?? true,
                };
            }).ToList();

            return Ok(result);
        }

        /// <summary>PUT /api/settings/notifications</summary>
        [HttpPut("notifications")]
        public async Task<IActionResult> SaveNotificationSettings(
            [FromBody] BulkNotificationSettingsRequest request,
            [FromQuery] int? tenantId = null)
        {
            var tid = ResolveTenantId(tenantId);
            if (tid is null) return BadRequest("Tenant context required.");

            var existing = await _context.TenantNotificationSettings
                .Where(s => s.TenantId == tid.Value)
                .ToListAsync();

            foreach (var dto in request.Settings)
            {
                var evt = (NotificationEventType)dto.EventType;
                var row = existing.FirstOrDefault(s => s.EventType == evt);

                if (row is null)
                {
                    row = new TenantNotificationSettings { TenantId = tid.Value, EventType = evt };
                    _context.TenantNotificationSettings.Add(row);
                }

                row.NotifyCustomer    = dto.NotifyCustomer;
                row.NotifyOrganizer   = dto.NotifyOrganizer;
                row.NotifyTenantAdmin = dto.NotifyTenantAdmin;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Notification settings saved." });
        }
    }
}
