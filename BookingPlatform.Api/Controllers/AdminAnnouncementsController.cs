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
    [Route("api/admin/announcements")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public class AdminAnnouncementsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public AdminAnnouncementsController(AppDbContext context, ITenantContext tenantContext)
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

            var list = await _context.Announcements
                .AsNoTracking()
                .Where(a => a.TenantId == tid.Value)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AdminAnnouncementListDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    IsPublished = a.IsPublished,
                    PublishAt = a.PublishAt,
                    AreaId = a.AreaId,
                    AreaName = a.Area != null ? a.Area.Name : null,
                    CommunityId = a.CommunityId,
                    CommunityName = a.Community != null ? a.Community.Name : null,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var dto = await _context.Announcements
                .AsNoTracking()
                .Where(a => a.TenantId == tid.Value && a.Id == id)
                .Select(a => new AdminAnnouncementDetailDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Body = a.Body,
                    IsPublished = a.IsPublished,
                    PublishAt = a.PublishAt,
                    AreaId = a.AreaId,
                    AreaName = a.Area != null ? a.Area.Name : null,
                    CommunityId = a.CommunityId,
                    CommunityName = a.Community != null ? a.Community.Name : null,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                })
                .FirstOrDefaultAsync();

            if (dto is null)
                return NotFound(ApiResponse<object>.NotFound("Announcement not found."));

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertAnnouncementRequest req)
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

            var entity = new Announcement
            {
                TenantId = tid.Value,
                Title = req.Title.Trim(),
                Body = req.Body.Trim(),
                IsPublished = req.IsPublished,
                PublishAt = req.PublishAt,
                AreaId = req.AreaId,
                CommunityId = req.CommunityId,
                CreatedByUserId = _tenantContext.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Announcements.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<int>.Ok(entity.Id, "Announcement created."));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpsertAnnouncementRequest req)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var entity = await _context.Announcements
                .FirstOrDefaultAsync(a => a.TenantId == tid.Value && a.Id == id);

            if (entity is null)
                return NotFound(ApiResponse<object>.NotFound("Announcement not found."));

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
            entity.IsPublished = req.IsPublished;
            entity.PublishAt = req.PublishAt;
            entity.AreaId = req.AreaId;
            entity.CommunityId = req.CommunityId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Announcement updated."));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var entity = await _context.Announcements
                .FirstOrDefaultAsync(a => a.TenantId == tid.Value && a.Id == id);

            if (entity is null)
                return NotFound(ApiResponse<object>.NotFound("Announcement not found."));

            _context.Announcements.Remove(entity);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<string>.Ok("ok", "Announcement deleted."));
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

