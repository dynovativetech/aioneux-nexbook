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
    public class InstructorsController : ControllerBase
    {
        private readonly AppDbContext   _context;
        private readonly IAuditService  _audit;
        private readonly ITenantContext _tenantContext;

        public InstructorsController(AppDbContext context, IAuditService audit, ITenantContext tenantContext)
        {
            _context       = context;
            _audit         = audit;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? tenantId = null)
        {
            IQueryable<Instructor> query = _context.Instructors;

            if (_tenantContext.IsSuperAdmin && tenantId.HasValue)
                query = _context.Instructors.IgnoreQueryFilters()
                    .Where(i => i.TenantId == tenantId.Value);

            var instructors = await query.AsNoTracking().ToListAsync();
            return Ok(instructors);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor is null) return NotFound();
            return Ok(instructor);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create([FromBody] CreateInstructorRequest request)
        {
            if (request is null) return BadRequest();

            var instructor = new Instructor
            {
                TenantId        = _tenantContext.TenantId ?? 1,
                Name            = request.Name,
                Expertise       = request.Expertise,
                ExperienceYears = request.ExperienceYears,
                Bio             = request.Bio,
                ExpertiseSummary = request.ExpertiseSummary,
                ProfileImageUrl = request.ProfileImageUrl,
                ContactEmail    = request.ContactEmail,
                ContactPhone    = request.ContactPhone,
                IsActive        = true
            };

            _context.Instructors.Add(instructor);
            await _context.SaveChangesAsync();

            await _audit.LogAsync("Create", "Instructor", instructor.Id, instructor.Name,
                $"Created instructor '{instructor.Name}' (expertise: {instructor.Expertise}, {instructor.ExperienceYears} yrs).");

            return CreatedAtAction(nameof(GetById), new { id = instructor.Id }, instructor);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateInstructorRequest request)
        {
            if (request is null) return BadRequest();

            var existing = await _context.Instructors.FindAsync(id);
            if (existing is null) return NotFound();

            var before = $"Name='{existing.Name}', Expertise='{existing.Expertise}', Years={existing.ExperienceYears}";

            existing.Name            = request.Name;
            existing.Expertise       = request.Expertise;
            existing.ExperienceYears = request.ExperienceYears;
            existing.Bio             = request.Bio;
            existing.ExpertiseSummary = request.ExpertiseSummary;
            existing.ProfileImageUrl = request.ProfileImageUrl;
            existing.ContactEmail    = request.ContactEmail;
            existing.ContactPhone    = request.ContactPhone;

            await _context.SaveChangesAsync();

            await _audit.LogAsync("Update", "Instructor", id, request.Name,
                $"Updated instructor #{id}. Before: [{before}] → After: Name='{request.Name}'.");

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor is null) return NotFound();

            _context.Instructors.Remove(instructor);
            await _context.SaveChangesAsync();

            await _audit.LogAsync("Delete", "Instructor", id, instructor.Name,
                $"Deleted instructor '{instructor.Name}' (expertise: {instructor.Expertise}).");

            return NoContent();
        }
    }
}
