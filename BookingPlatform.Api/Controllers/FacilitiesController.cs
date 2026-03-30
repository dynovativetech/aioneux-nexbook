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
    public class FacilitiesController : ControllerBase
    {
        private readonly AppDbContext   _context;
        private readonly IAuditService  _audit;
        private readonly ITenantContext _tenantContext;

        public FacilitiesController(AppDbContext context, IAuditService audit, ITenantContext tenantContext)
        {
            _context       = context;
            _audit         = audit;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int?  tenantId  = null,
            [FromQuery] int?  venueId   = null,
            [FromQuery] bool? activeOnly = null)
        {
            IQueryable<Facility> query = _context.Facilities
                .Include(f => f.Images)
                .Include(f => f.FacilityActivities).ThenInclude(fa => fa.Activity);

            if (_tenantContext.IsSuperAdmin && tenantId.HasValue)
                query = _context.Facilities.IgnoreQueryFilters()
                    .Include(f => f.Images)
                    .Include(f => f.FacilityActivities).ThenInclude(fa => fa.Activity)
                    .Where(f => f.TenantId == tenantId.Value);

            if (venueId.HasValue)   query = query.Where(f => f.VenueId == venueId);
            if (activeOnly == true) query = query.Where(f => f.IsActive);

            var facilities = await query.AsNoTracking().ToListAsync();
            return Ok(facilities);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var facility = await _context.Facilities
                .Include(f => f.Images)
                .Include(f => f.FacilityActivities).ThenInclude(fa => fa.Activity)
                .Include(f => f.OperatingHours)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == id);

            if (facility is null) return NotFound();
            return Ok(facility);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create([FromBody] CreateFacilityRequest request)
        {
            if (request is null) return BadRequest();

            var tenantId = _tenantContext.TenantId ?? 1;

            var facility = new Facility
            {
                TenantId                 = tenantId,
                Name                     = request.Name,
                Location                 = request.Location,
                Capacity                 = request.Capacity,
                VenueId                  = request.VenueId,
                Code                     = request.Code,
                Description              = request.Description,
                ShortDescription         = request.ShortDescription,
                Latitude                 = request.Latitude,
                Longitude                = request.Longitude,
                MapAddress               = request.MapAddress,
                PhysicalAddress          = request.PhysicalAddress,
                ContactPersonName        = request.ContactPersonName,
                ContactEmail             = request.ContactEmail,
                ContactPhone             = request.ContactPhone,
                BookingConfirmationEmail = request.BookingConfirmationEmail,
                RequiresApproval         = request.RequiresApproval,
                SlotDurationMinutes      = request.SlotDurationMinutes,
                MaxConsecutiveSlots      = request.MaxConsecutiveSlots,
                IsActive                 = true
            };

            _context.Facilities.Add(facility);
            await _context.SaveChangesAsync();

            await _audit.LogAsync("Create", "Facility", facility.Id, facility.Name,
                $"Created facility '{facility.Name}' at '{facility.Location}' (capacity {facility.Capacity}).");

            return CreatedAtAction(nameof(GetById), new { id = facility.Id }, facility);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateFacilityRequest request)
        {
            if (request is null) return BadRequest();

            var existing = await _context.Facilities.FindAsync(id);
            if (existing is null) return NotFound();

            var before = $"Name='{existing.Name}', Capacity={existing.Capacity}";

            existing.Name                    = request.Name;
            existing.Location                = request.Location;
            existing.Capacity                = request.Capacity;
            existing.VenueId                 = request.VenueId;
            existing.Code                    = request.Code;
            existing.Description             = request.Description;
            existing.ShortDescription        = request.ShortDescription;
            existing.Latitude                = request.Latitude;
            existing.Longitude               = request.Longitude;
            existing.MapAddress              = request.MapAddress;
            existing.PhysicalAddress         = request.PhysicalAddress;
            existing.ContactPersonName       = request.ContactPersonName;
            existing.ContactEmail            = request.ContactEmail;
            existing.ContactPhone            = request.ContactPhone;
            existing.BookingConfirmationEmail = request.BookingConfirmationEmail;
            existing.RequiresApproval        = request.RequiresApproval;
            existing.SlotDurationMinutes     = request.SlotDurationMinutes;
            existing.MaxConsecutiveSlots     = request.MaxConsecutiveSlots;

            await _context.SaveChangesAsync();

            await _audit.LogAsync("Update", "Facility", id, request.Name,
                $"Updated facility #{id}. Before: [{before}].");

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            var facility = await _context.Facilities.FindAsync(id);
            if (facility is null) return NotFound();

            _context.Facilities.Remove(facility);
            await _context.SaveChangesAsync();

            await _audit.LogAsync("Delete", "Facility", id, facility.Name,
                $"Deleted facility '{facility.Name}' at '{facility.Location}'.");

            return NoContent();
        }

        // ════════════════════════════════════════════════════════════════════
        // Activity links
        // ════════════════════════════════════════════════════════════════════

        [HttpPost("{id:int}/activities")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> LinkActivity(int id, [FromBody] LinkActivityRequest req)
        {
            var facility = await _context.Facilities.FindAsync(id);
            if (facility is null) return NotFound("Facility not found.");

            var activity = await _context.Activities.FindAsync(req.ActivityId);
            if (activity is null) return NotFound("Activity not found.");

            var exists = await _context.FacilityActivities
                .AnyAsync(fa => fa.FacilityId == id && fa.ActivityId == req.ActivityId);

            if (!exists)
            {
                _context.FacilityActivities.Add(new FacilityActivity
                {
                    FacilityId = id,
                    ActivityId = req.ActivityId
                });
                await _context.SaveChangesAsync();
            }

            return Ok(ApiResponse<bool>.Ok(true, "Activity linked to facility."));
        }

        [HttpDelete("{id:int}/activities/{activityId:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> UnlinkActivity(int id, int activityId)
        {
            var link = await _context.FacilityActivities
                .FirstOrDefaultAsync(fa => fa.FacilityId == id && fa.ActivityId == activityId);

            if (link is null) return NotFound();

            _context.FacilityActivities.Remove(link);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Ok(true, "Activity unlinked from facility."));
        }

        // ════════════════════════════════════════════════════════════════════
        // Operating hours
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("{id:int}/hours")]
        public async Task<IActionResult> GetFacilityHours(int id)
        {
            var hours = await _context.FacilityOperatingHours
                .Where(h => h.FacilityId == id)
                .OrderBy(h => h.DayOfWeek)
                .AsNoTracking()
                .ToListAsync();

            return Ok(hours.Select(h => new FacilityOperatingHoursDto
            {
                Id        = h.Id,
                DayOfWeek = h.DayOfWeek,
                OpenTime  = h.OpenTime.ToString(@"hh\:mm"),
                CloseTime = h.CloseTime.ToString(@"hh\:mm"),
                IsClosed  = h.IsClosed
            }));
        }

        [HttpPut("{id:int}/hours")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> SetFacilityHours(int id, [FromBody] SetFacilityOperatingHoursRequest req)
        {
            var facility = await _context.Facilities.FindAsync(id);
            if (facility is null) return NotFound();

            var existing = await _context.FacilityOperatingHours.Where(h => h.FacilityId == id).ToListAsync();
            _context.FacilityOperatingHours.RemoveRange(existing);

            foreach (var h in req.Hours)
            {
                _context.FacilityOperatingHours.Add(new FacilityOperatingHours
                {
                    FacilityId = id,
                    DayOfWeek  = h.DayOfWeek,
                    OpenTime   = TimeSpan.Parse(h.OpenTime),
                    CloseTime  = TimeSpan.Parse(h.CloseTime),
                    IsClosed   = h.IsClosed
                });
            }

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Update", "FacilityHours", id, facility.Name, "Facility hours updated.");

            return Ok(ApiResponse<bool>.Ok(true, "Facility operating hours updated."));
        }

        // ════════════════════════════════════════════════════════════════════
        // Slot configuration
        // ════════════════════════════════════════════════════════════════════

        [HttpPut("{id:int}/slot-config")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> SetSlotConfig(int id, [FromBody] SetSlotConfigRequest req)
        {
            var facility = await _context.Facilities.FindAsync(id);
            if (facility is null) return NotFound();

            facility.SlotDurationMinutes = req.SlotDurationMinutes;
            facility.MaxConsecutiveSlots = req.MaxConsecutiveSlots;

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Update", "Facility", id, facility.Name,
                $"Slot config updated: {req.SlotDurationMinutes}min slots, max {req.MaxConsecutiveSlots} consecutive.");

            return Ok(ApiResponse<bool>.Ok(true, "Slot configuration updated."));
        }
    }
}
