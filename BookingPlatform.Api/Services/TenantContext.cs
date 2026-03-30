using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.Services
{
    public class TenantContext : ITenantContext
    {
        public int?   TenantId     { get; }
        public int    UserId       { get; }
        public string Role         { get; }
        public bool   IsSuperAdmin => Role == Roles.SuperAdmin;

        public TenantContext(IHttpContextAccessor httpContextAccessor)
        {
            var user = httpContextAccessor.HttpContext?.User;

            var sub = user?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                   ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(sub, out var userId);
            UserId = userId;

            Role = user?.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

            var tenantClaim = user?.FindFirst("tenantId")?.Value;
            if (int.TryParse(tenantClaim, out var tenantId))
                TenantId = tenantId;
        }
    }
}
