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
    [Route("api/community")]
    [Authorize]
    public class CommunityController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public CommunityController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet("announcements")]
        public async Task<IActionResult> ListAnnouncements()
        {
            var me = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var tid = me.TenantId ?? _tenantContext.TenantId;
            if (!tid.HasValue) return Ok(ApiResponse<List<MemberAnnouncementDto>>.Ok([]));

            var myAreaId = me.AreaId;
            var myCommunityId = me.CommunityId;

            var items = await _context.Announcements
                .AsNoTracking()
                .Where(a => a.TenantId == tid.Value && a.IsPublished)
                .Where(a =>
                    (a.AreaId == null && a.CommunityId == null)
                    || (a.CommunityId != null && a.CommunityId == myCommunityId)
                    || (a.CommunityId == null && a.AreaId != null && a.AreaId == myAreaId))
                .OrderByDescending(a => a.PublishAt ?? a.CreatedAt)
                .Select(a => new MemberAnnouncementDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Body = a.Body,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    AreaId = a.AreaId,
                    CommunityId = a.CommunityId,
                    IsViewed = a.Views.Any(v => v.UserId == me.Id),
                })
                .ToListAsync();

            return Ok(ApiResponse<List<MemberAnnouncementDto>>.Ok(items));
        }

        [HttpPost("announcements/{id:int}/view")]
        public async Task<IActionResult> MarkAnnouncementViewed(int id)
        {
            if (_tenantContext.UserId <= 0) return Unauthorized();

            var exists = await _context.AnnouncementViews.AnyAsync(v => v.AnnouncementId == id && v.UserId == _tenantContext.UserId);
            if (exists)
                return Ok(ApiResponse<string>.Ok("ok"));

            _context.AnnouncementViews.Add(new AnnouncementView
            {
                AnnouncementId = id,
                UserId = _tenantContext.UserId,
                ViewedAt = DateTime.UtcNow,
            });
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok"));
        }

        [HttpGet("rules")]
        public async Task<IActionResult> ListRules()
        {
            var me = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var tid = me.TenantId ?? _tenantContext.TenantId;
            if (!tid.HasValue) return Ok(ApiResponse<List<RuleDto>>.Ok([]));

            var myAreaId = me.AreaId;
            var myCommunityId = me.CommunityId;

            var items = await _context.CommunityRules
                .AsNoTracking()
                .Where(r => r.TenantId == tid.Value && r.IsActive)
                .Where(r =>
                    (r.AreaId == null && r.CommunityId == null)
                    || (r.CommunityId != null && r.CommunityId == myCommunityId)
                    || (r.CommunityId == null && r.AreaId != null && r.AreaId == myAreaId))
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

            return Ok(ApiResponse<List<RuleDto>>.Ok(items));
        }

        [HttpGet("rules-document")]
        public async Task<IActionResult> GetRulesDocument()
        {
            var me = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var tid = me.TenantId ?? _tenantContext.TenantId;
            if (!tid.HasValue) return Ok(ApiResponse<CommunityRulesDocumentDto?>.Ok(null));

            var myAreaId = me.AreaId;
            var myCommunityId = me.CommunityId;

            var doc = await _context.CommunityRulesDocuments
                .AsNoTracking()
                .Include(d => d.Area)
                .Include(d => d.Community)
                .Where(d => d.TenantId == tid.Value)
                .Where(d =>
                    (d.AreaId == null && d.CommunityId == null)
                    || (d.CommunityId != null && d.CommunityId == myCommunityId)
                    || (d.CommunityId == null && d.AreaId != null && d.AreaId == myAreaId))
                .OrderByDescending(d => d.CommunityId != null) // prefer community-specific
                .ThenByDescending(d => d.AreaId != null)       // then area-specific
                .ThenByDescending(d => d.UpdatedAt)            // then newest
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

        [HttpGet("events")]
        public async Task<IActionResult> ListEvents()
        {
            var me = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var tid = me.TenantId ?? _tenantContext.TenantId;
            if (!tid.HasValue) return Ok(ApiResponse<List<MemberEventListDto>>.Ok([]));

            var myAreaId = me.AreaId;
            var myCommunityId = me.CommunityId;

            var now = DateTime.UtcNow.AddMonths(-6); // show recent/past 6 months

            var list = await _context.Events
                .AsNoTracking()
                .Where(e => e.TenantId == tid.Value && e.IsPublished && e.StartsAt >= now)
                .Where(e =>
                    (e.AreaId == null && e.CommunityId == null)
                    || (e.CommunityId != null && e.CommunityId == myCommunityId)
                    || (e.CommunityId == null && e.AreaId != null && e.AreaId == myAreaId))
                .OrderBy(e => e.StartsAt)
                .Select(e => new MemberEventListDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
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
                    MyRsvpStatus = e.Rsvps.Where(r => r.UserId == me.Id).Select(r => r.Status.ToString()).FirstOrDefault() ?? "None",
                    GoingCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Going),
                    MaybeCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Maybe),
                })
                .ToListAsync();

            return Ok(ApiResponse<List<MemberEventListDto>>.Ok(list));
        }

        [HttpPost("events/{id:int}/rsvp")]
        public async Task<IActionResult> Rsvp(int id, [FromBody] RsvpRequest req)
        {
            var me = await _context.Users.FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == id);
            if (ev is null) return NotFound(ApiResponse<object>.NotFound("Event not found."));

            if (!Enum.TryParse<EventRsvpStatus>(req.Status, ignoreCase: true, out var status))
                return BadRequest(ApiResponse<object>.Fail("Invalid RSVP status."));

            var existing = await _context.EventRsvps.FirstOrDefaultAsync(r => r.EventId == id && r.UserId == me.Id);
            if (existing is null)
            {
                _context.EventRsvps.Add(new EventRsvp
                {
                    EventId = id,
                    UserId = me.Id,
                    Status = status,
                    UpdatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                existing.Status = status;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "RSVP updated."));
        }
    }
}

