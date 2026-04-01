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
    [Route("api/admin/analytics")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public class AdminAnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public AdminAnalyticsController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet("announcements")]
        public async Task<IActionResult> AnnouncementAnalytics()
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var list = await _context.Announcements
                .AsNoTracking()
                .Where(a => a.TenantId == tid.Value)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AnnouncementAnalyticsDto
                {
                    AnnouncementId = a.Id,
                    Title = a.Title,
                    IsPublished = a.IsPublished,
                    PublishAt = a.PublishAt,
                    TotalViews = a.Views.Count,
                    UniqueViewers = a.Views.Select(v => v.UserId).Distinct().Count(),
                    CreatedAt = a.CreatedAt,
                })
                .ToListAsync();

            return Ok(ApiResponse<List<AnnouncementAnalyticsDto>>.Ok(list));
        }

        [HttpGet("events")]
        public async Task<IActionResult> EventAnalytics()
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var list = await _context.Events
                .AsNoTracking()
                .Where(e => e.TenantId == tid.Value)
                .OrderByDescending(e => e.StartsAt)
                .Select(e => new EventAnalyticsDto
                {
                    EventId = e.Id,
                    Title = e.Title,
                    IsPublished = e.IsPublished,
                    StartsAt = e.StartsAt,
                    GoingCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Going),
                    MaybeCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.Maybe),
                    NotGoingCount = e.Rsvps.Count(r => r.Status == EventRsvpStatus.NotGoing),
                })
                .ToListAsync();

            return Ok(ApiResponse<List<EventAnalyticsDto>>.Ok(list));
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

