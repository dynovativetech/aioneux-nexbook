using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.Services
{
    public class AuditService : IAuditService
    {
        private readonly AppDbContext        _context;
        private readonly IHttpContextAccessor _http;
        private readonly ITenantContext      _tenantContext;

        public AuditService(AppDbContext context, IHttpContextAccessor http, ITenantContext tenantContext)
        {
            _context       = context;
            _http          = http;
            _tenantContext = tenantContext;
        }

        public async Task LogAsync(
            string  action,
            string  entityType,
            int?    entityId   = null,
            string? entityName = null,
            string? details    = null)
        {
            var ctx = _http.HttpContext;

            // Resolve actor from JWT claims
            int?   actorId    = null;
            string actorEmail = "system";
            string actorName  = "System";
            string? ip        = null;

            if (ctx is not null)
            {
                var sub = ctx.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                       ?? ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (int.TryParse(sub, out var parsedId))
                    actorId = parsedId;

                actorEmail = ctx.User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                          ?? ctx.User.FindFirst(ClaimTypes.Email)?.Value
                          ?? "anonymous";

                actorName  = ctx.User.FindFirst(ClaimTypes.Name)?.Value
                          ?? actorEmail;

                ip = ctx.Connection.RemoteIpAddress?.ToString();
            }

            var log = new AuditLog
            {
                TenantId   = _tenantContext.TenantId,
                Timestamp  = DateTime.UtcNow,
                Action     = action,
                EntityType = entityType,
                EntityId   = entityId,
                EntityName = entityName,
                Details    = details,
                ActorId    = actorId,
                ActorEmail = actorEmail,
                ActorName  = actorName,
                IpAddress  = ip,
            };

            _context.AuditLogs.Add(log);

            // Fire-and-forget; never block the main request for a log write
            try   { await _context.SaveChangesAsync(); }
            catch { /* audit write failure must never break the main request */ }
        }
    }
}
