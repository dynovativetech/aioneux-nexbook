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
    [Route("api/admin/events")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public class AdminEventsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public AdminEventsController(AppDbContext context, ITenantContext tenantContext)
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

            var list = await _context.Events
                .AsNoTracking()
                .Where(e => e.TenantId == tid.Value)
                .OrderByDescending(e => e.StartsAt)
                .Select(e => new AdminEventListDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    IsPublished = e.IsPublished,
                    StartsAt = e.StartsAt,
                    EndsAt = e.EndsAt,
                    LocationText = e.LocationText,
                    MainImageUrl = e.MainImageUrl,
                    AddressText = e.AddressText,
                    ContactPersonName = e.ContactPersonName,
                    ContactPersonEmail = e.ContactPersonEmail,
                    ContactPersonPhone = e.ContactPersonPhone,
                    AreaId = e.AreaId,
                    AreaName = e.Area != null ? e.Area.Name : null,
                    CommunityId = e.CommunityId,
                    CommunityName = e.Community != null ? e.Community.Name : null,
                    RsvpGoingCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Going),
                    RsvpMaybeCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Maybe),
                    RsvpNotGoingCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.NotGoing),
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
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

            var dto = await _context.Events
                .AsNoTracking()
                .Where(e => e.TenantId == tid.Value && e.Id == id)
                .Select(e => new AdminEventDetailDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    IsPublished = e.IsPublished,
                    StartsAt = e.StartsAt,
                    EndsAt = e.EndsAt,
                    LocationText = e.LocationText,
                    MainImageUrl = e.MainImageUrl,
                    AddressText = e.AddressText,
                    ContactPersonName = e.ContactPersonName,
                    ContactPersonEmail = e.ContactPersonEmail,
                    ContactPersonPhone = e.ContactPersonPhone,
                    AreaId = e.AreaId,
                    AreaName = e.Area != null ? e.Area.Name : null,
                    CommunityId = e.CommunityId,
                    CommunityName = e.Community != null ? e.Community.Name : null,
                    RsvpGoingCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Going),
                    RsvpMaybeCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Maybe),
                    RsvpNotGoingCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.NotGoing),
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
                })
                .FirstOrDefaultAsync();

            if (dto is null)
                return NotFound(ApiResponse<object>.NotFound("Event not found."));

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertEventRequest req)
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

            var entity = new Event
            {
                TenantId = tid.Value,
                Title = req.Title.Trim(),
                Description = req.Description.Trim(),
                StartsAt = req.StartsAt,
                EndsAt = req.EndsAt,
                LocationText = string.IsNullOrWhiteSpace(req.LocationText) ? null : req.LocationText.Trim(),
                AddressText = string.IsNullOrWhiteSpace(req.AddressText) ? null : req.AddressText.Trim(),
                ContactPersonName = string.IsNullOrWhiteSpace(req.ContactPersonName) ? null : req.ContactPersonName.Trim(),
                ContactPersonEmail = string.IsNullOrWhiteSpace(req.ContactPersonEmail) ? null : req.ContactPersonEmail.Trim(),
                ContactPersonPhone = string.IsNullOrWhiteSpace(req.ContactPersonPhone) ? null : req.ContactPersonPhone.Trim(),
                IsPublished = req.IsPublished,
                AreaId = req.AreaId,
                CommunityId = req.CommunityId,
                CreatedByUserId = _tenantContext.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Events.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<int>.Ok(entity.Id, "Event created."));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpsertEventRequest req)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var entity = await _context.Events.FirstOrDefaultAsync(e => e.TenantId == tid.Value && e.Id == id);
            if (entity is null)
                return NotFound(ApiResponse<object>.NotFound("Event not found."));

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
            entity.Description = req.Description.Trim();
            entity.StartsAt = req.StartsAt;
            entity.EndsAt = req.EndsAt;
            entity.LocationText = string.IsNullOrWhiteSpace(req.LocationText) ? null : req.LocationText.Trim();
            entity.AddressText = string.IsNullOrWhiteSpace(req.AddressText) ? null : req.AddressText.Trim();
            entity.ContactPersonName = string.IsNullOrWhiteSpace(req.ContactPersonName) ? null : req.ContactPersonName.Trim();
            entity.ContactPersonEmail = string.IsNullOrWhiteSpace(req.ContactPersonEmail) ? null : req.ContactPersonEmail.Trim();
            entity.ContactPersonPhone = string.IsNullOrWhiteSpace(req.ContactPersonPhone) ? null : req.ContactPersonPhone.Trim();
            entity.IsPublished = req.IsPublished;
            entity.AreaId = req.AreaId;
            entity.CommunityId = req.CommunityId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Event updated."));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var entity = await _context.Events.FirstOrDefaultAsync(e => e.TenantId == tid.Value && e.Id == id);
            if (entity is null)
                return NotFound(ApiResponse<object>.NotFound("Event not found."));

            _context.Events.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Event deleted."));
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

