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
    [Route("api/[controller]")]
    public class ActivitiesController : ControllerBase
    {
        private readonly AppDbContext   _context;
        private readonly IAuditService  _audit;
        private readonly ITenantContext _tenantContext;

        public ActivitiesController(AppDbContext context, IAuditService audit, ITenantContext tenantContext)
        {
            _context       = context;
            _audit         = audit;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? tenantId = null)
        {
            IQueryable<Activity> query = _context.Activities;

            if (_tenantContext.IsSuperAdmin && tenantId.HasValue)
                query = _context.Activities.IgnoreQueryFilters()
                    .Where(a => a.TenantId == tenantId.Value);

            var activities = await query.AsNoTracking().ToListAsync();
            return Ok(activities);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var activity = await _context.Activities.FindAsync(id);
            if (activity is null) return NotFound();
            return Ok(activity);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create([FromBody] CreateActivityRequest request)
        {
            if (request is null) return BadRequest();

            var activity = new Activity
            {
                TenantId        = _tenantContext.TenantId ?? 1,
                Name            = request.Name,
                DurationMinutes = request.DurationMinutes,
                Description     = request.Description,
                Category        = request.Category,
                BufferMinutes   = request.BufferMinutes,
                Price           = request.Price,
                IsActive        = true
            };

            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();

            await _audit.LogAsync("Create", "Activity", activity.Id, activity.Name,
                $"Created activity '{activity.Name}' with duration {activity.DurationMinutes} min.");

            return CreatedAtAction(nameof(GetById), new { id = activity.Id }, activity);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateActivityRequest request)
        {
            if (request is null) return BadRequest();

            var existing = await _context.Activities.FindAsync(id);
            if (existing is null) return NotFound();

            var before = $"Name='{existing.Name}', Duration={existing.DurationMinutes}min";

            existing.Name            = request.Name;
            existing.DurationMinutes = request.DurationMinutes;
            existing.Description     = request.Description;
            existing.Category        = request.Category;
            existing.BufferMinutes   = request.BufferMinutes;
            existing.Price           = request.Price;

            await _context.SaveChangesAsync();

            await _audit.LogAsync("Update", "Activity", id, request.Name,
                $"Updated activity #{id}. Before: [{before}] → After: Name='{request.Name}', Duration={request.DurationMinutes}min.");

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            var activity = await _context.Activities.FindAsync(id);
            if (activity is null) return NotFound();

            _context.Activities.Remove(activity);
            await _context.SaveChangesAsync();

            await _audit.LogAsync("Delete", "Activity", id, activity.Name,
                $"Deleted activity '{activity.Name}' ({activity.DurationMinutes} min).");

            return NoContent();
        }
    }
}
