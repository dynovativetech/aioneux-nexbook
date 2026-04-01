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
    [Route("api/admin/rules")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public class AdminRulesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public AdminRulesController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var list = await _context.CommunityRules
                .AsNoTracking()
                .Where(r => r.TenantId == tid.Value)
                .OrderBy(r => r.SortOrder)
                .Select(r => new RuleDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    Body = r.Body,
                    SortOrder = r.SortOrder,
                    IsActive = r.IsActive,
                    AreaId = r.AreaId,
                    CommunityId = r.CommunityId,
                })
                .ToListAsync();

            return Ok(ApiResponse<List<RuleDto>>.Ok(list));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRuleRequest req)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

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

            var entity = new CommunityRule
            {
                TenantId = tid.Value,
                Title = req.Title.Trim(),
                Body = req.Body.Trim(),
                SortOrder = req.SortOrder,
                IsActive = req.IsActive,
                AreaId = req.AreaId,
                CommunityId = req.CommunityId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.CommunityRules.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<int>.Ok(entity.Id, "Rule created."));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateRuleRequest req)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var entity = await _context.CommunityRules.FirstOrDefaultAsync(r => r.TenantId == tid.Value && r.Id == id);
            if (entity is null)
                return NotFound(ApiResponse<object>.NotFound("Rule not found."));

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

            entity.Title = req.Title.Trim();
            entity.Body = req.Body.Trim();
            entity.SortOrder = req.SortOrder;
            entity.IsActive = req.IsActive;
            entity.AreaId = req.AreaId;
            entity.CommunityId = req.CommunityId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Rule updated."));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var entity = await _context.CommunityRules.FirstOrDefaultAsync(r => r.TenantId == tid.Value && r.Id == id);
            if (entity is null)
                return NotFound(ApiResponse<object>.NotFound("Rule not found."));

            _context.CommunityRules.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Rule deleted."));
        }

        private async Task<int?> ResolveTenantIdAsync()
        {
            var tid = _tenantContext.TenantId;
            if (!tid.HasValue && _tenantContext.UserId > 0)
            {
                var me = await _context.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
                tid = me?.TenantId;
            }
            return tid;
        }
    }
}

