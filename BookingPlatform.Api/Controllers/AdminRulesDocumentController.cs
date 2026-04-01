using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/admin/rules-document")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public class AdminRulesDocumentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public AdminRulesDocumentController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var doc = await _context.CommunityRulesDocuments
                .AsNoTracking()
                .Include(d => d.Area)
                .Include(d => d.Community)
                .Where(d => d.TenantId == tid.Value)
                .OrderByDescending(d => d.UpdatedAt)
                .Select(d => new CommunityRulesDocumentDto
                {
                    Id = d.Id,
                    AreaId = d.AreaId,
                    AreaName = d.Area != null ? d.Area.Name : null,
                    CommunityId = d.CommunityId,
                    CommunityName = d.Community != null ? d.Community.Name : null,
                    Html = d.Html,
                    UpdatedAt = d.UpdatedAt
                })
                .FirstOrDefaultAsync();

            return Ok(ApiResponse<CommunityRulesDocumentDto?>.Ok(doc));
        }

        [HttpPut]
        public async Task<IActionResult> Upsert([FromBody] UpsertCommunityRulesDocumentRequest req)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));
            if (_tenantContext.UserId <= 0)
                return BadRequest(ApiResponse<object>.Fail("User context is missing."));

            if (req.AreaId.HasValue)
            {
                var ok = await _context.Areas.AsNoTracking().AnyAsync(a => a.Id == req.AreaId && a.TenantId == tid.Value);
                if (!ok) return BadRequest(ApiResponse<object>.Fail("Invalid areaId for this tenant."));
            }
            if (req.CommunityId.HasValue)
            {
                var ok = await _context.Communities.AsNoTracking().AnyAsync(c => c.Id == req.CommunityId && c.TenantId == tid.Value);
                if (!ok) return BadRequest(ApiResponse<object>.Fail("Invalid communityId for this tenant."));
            }

            var doc = await _context.CommunityRulesDocuments.FirstOrDefaultAsync(d => d.TenantId == tid.Value);
            if (doc is null)
            {
                doc = new CommunityRulesDocument
                {
                    TenantId = tid.Value,
                    AreaId = req.AreaId,
                    CommunityId = req.CommunityId,
                    Html = req.Html,
                    UpdatedByUserId = _tenantContext.UserId,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.CommunityRulesDocuments.Add(doc);
            }
            else
            {
                doc.AreaId = req.AreaId;
                doc.CommunityId = req.CommunityId;
                doc.Html = req.Html;
                doc.UpdatedByUserId = _tenantContext.UserId;
                doc.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<int>.Ok(doc.Id, "Rules updated."));
        }

        private async Task<int?> ResolveTenantIdAsync()
        {
            if (_tenantContext.TenantId > 0) return _tenantContext.TenantId;
            if (_tenantContext.IsSuperAdmin && Request.Headers.TryGetValue("X-Tenant-Id", out var values))
                if (int.TryParse(values.FirstOrDefault(), out var tid) && tid > 0) return tid;
            return await Task.FromResult<int?>(null);
        }
    }
}

