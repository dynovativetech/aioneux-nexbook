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
    [Route("api/favorites")]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public FavoritesController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var me = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var tid = me.TenantId ?? _tenantContext.TenantId;
            if (!tid.HasValue) return Ok(ApiResponse<List<FavoriteDto>>.Ok([]));

            var favs = await _context.UserFavorites
                .AsNoTracking()
                .Where(f => f.TenantId == tid.Value && f.UserId == me.Id)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            // Enrich names with best-effort lookups
            var venueIds = favs.Where(f => f.TargetType == ContentTargetType.Venue).Select(f => f.TargetId).Distinct().ToList();
            var facilityIds = favs.Where(f => f.TargetType == ContentTargetType.Facility).Select(f => f.TargetId).Distinct().ToList();

            var venueNames = await _context.Venues.AsNoTracking()
                .Where(v => venueIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id, v => v.Name);

            var facilityNames = await _context.Facilities.AsNoTracking()
                .Where(f => facilityIds.Contains(f.Id))
                .ToDictionaryAsync(f => f.Id, f => f.Name);

            var dto = favs.Select(f => new FavoriteDto
            {
                Id = f.Id,
                TargetType = f.TargetType.ToString(),
                TargetId = f.TargetId,
                CreatedAt = f.CreatedAt,
                Name = f.TargetType == ContentTargetType.Venue
                    ? (venueNames.TryGetValue(f.TargetId, out var vn) ? vn : null)
                    : (facilityNames.TryGetValue(f.TargetId, out var fn) ? fn : null)
            }).ToList();

            return Ok(ApiResponse<List<FavoriteDto>>.Ok(dto));
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddFavoriteRequest req)
        {
            var me = await _context.Users.FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            var tid = me.TenantId ?? _tenantContext.TenantId;
            if (!tid.HasValue) return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            if (!Enum.TryParse<ContentTargetType>(req.TargetType, ignoreCase: true, out var targetType))
                return BadRequest(ApiResponse<object>.Fail("Invalid targetType. Use Venue or Facility."));

            var exists = await _context.UserFavorites.AnyAsync(f =>
                f.UserId == me.Id && f.TargetType == targetType && f.TargetId == req.TargetId);

            if (exists)
                return Ok(ApiResponse<string>.Ok("ok", "Already favorited."));

            _context.UserFavorites.Add(new UserFavorite
            {
                TenantId = tid.Value,
                UserId = me.Id,
                TargetType = targetType,
                TargetId = req.TargetId,
                CreatedAt = DateTime.UtcNow,
            });

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Added to favorites."));
        }

        [HttpDelete]
        public async Task<IActionResult> Remove([FromQuery] string targetType, [FromQuery] int targetId)
        {
            var me = await _context.Users.FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
            if (me is null) return Unauthorized();

            if (!Enum.TryParse<ContentTargetType>(targetType, ignoreCase: true, out var tt))
                return BadRequest(ApiResponse<object>.Fail("Invalid targetType. Use Venue or Facility."));

            var existing = await _context.UserFavorites
                .FirstOrDefaultAsync(f => f.UserId == me.Id && f.TargetType == tt && f.TargetId == targetId);

            if (existing is null)
                return Ok(ApiResponse<string>.Ok("ok", "Not favorited."));

            _context.UserFavorites.Remove(existing);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<string>.Ok("ok", "Removed from favorites."));
        }
    }
}

