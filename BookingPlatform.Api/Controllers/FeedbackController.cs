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
    [Route("api/feedback")]
    [Authorize]
    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public FeedbackController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetForTarget([FromQuery] string targetType, [FromQuery] int targetId)
        {
            if (!Enum.TryParse<ContentTargetType>(targetType, ignoreCase: true, out var tt))
                return BadRequest(ApiResponse<object>.Fail("Invalid targetType. Use Venue or Facility."));

            var list = await _context.Feedback
                .AsNoTracking()
                .Where(f => f.TargetType == tt && f.TargetId == targetId)
                .OrderByDescending(f => f.UpdatedAt)
                .Select(f => new FeedbackDto
                {
                    Id = f.Id,
                    TargetType = f.TargetType.ToString(),
                    TargetId = f.TargetId,
                    Rating = f.Rating,
                    Comment = f.Comment,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt,
                })
                .ToListAsync();

            return Ok(ApiResponse<List<FeedbackDto>>.Ok(list));
        }

        [HttpPost]
        public async Task<IActionResult> Upsert([FromBody] UpsertFeedbackRequest req)
        {
            var me = await _context.Users.FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var tid = me.TenantId ?? _tenantContext.TenantId;
            if (!tid.HasValue) return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            if (!Enum.TryParse<ContentTargetType>(req.TargetType, ignoreCase: true, out var tt))
                return BadRequest(ApiResponse<object>.Fail("Invalid targetType. Use Venue or Facility."));

            var existing = await _context.Feedback
                .FirstOrDefaultAsync(f => f.UserId == me.Id && f.TargetType == tt && f.TargetId == req.TargetId);

            if (existing is null)
            {
                _context.Feedback.Add(new Feedback
                {
                    TenantId = tid.Value,
                    UserId = me.Id,
                    TargetType = tt,
                    TargetId = req.TargetId,
                    Rating = req.Rating,
                    Comment = string.IsNullOrWhiteSpace(req.Comment) ? null : req.Comment.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                existing.Rating = req.Rating;
                existing.Comment = string.IsNullOrWhiteSpace(req.Comment) ? null : req.Comment.Trim();
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Feedback saved."));
        }
    }
}

