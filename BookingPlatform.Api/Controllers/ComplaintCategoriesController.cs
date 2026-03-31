using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/complaint-categories")]
    public class ComplaintCategoriesController : ControllerBase
    {
        private readonly AppDbContext   _context;
        private readonly ITenantContext _tenantContext;

        public ComplaintCategoriesController(AppDbContext context, ITenantContext tenantContext)
        {
            _context       = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tenantId = _tenantContext.TenantId ?? 1;

            var categories = await _context.ComplaintCategories
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .Select(c => new ComplaintCategoryDto
                {
                    Id        = c.Id,
                    Name      = c.Name,
                    IsActive  = c.IsActive,
                    SortOrder = c.SortOrder,
                })
                .ToListAsync();

            return Ok(ApiResponse<List<ComplaintCategoryDto>>.Ok(categories));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateComplaintCategoryRequest request)
        {
            var tenantId = _tenantContext.TenantId ?? 1;

            var maxOrder = await _context.ComplaintCategories
                .Where(c => c.TenantId == tenantId)
                .Select(c => (int?)c.SortOrder)
                .MaxAsync() ?? 0;

            var category = new ComplaintCategory
            {
                TenantId  = tenantId,
                Name      = request.Name.Trim(),
                IsActive  = true,
                SortOrder = maxOrder + 1,
            };

            _context.ComplaintCategories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<ComplaintCategoryDto>.Ok(new ComplaintCategoryDto
            {
                Id        = category.Id,
                Name      = category.Name,
                IsActive  = category.IsActive,
                SortOrder = category.SortOrder,
            }, "Category created."));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateComplaintCategoryRequest request)
        {
            var tenantId = _tenantContext.TenantId ?? 1;
            var category = await _context.ComplaintCategories
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (category is null)
                return NotFound(ApiResponse<bool>.NotFound($"Category #{id} not found."));

            category.Name     = request.Name.Trim();
            category.IsActive = request.IsActive;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<ComplaintCategoryDto>.Ok(new ComplaintCategoryDto
            {
                Id        = category.Id,
                Name      = category.Name,
                IsActive  = category.IsActive,
                SortOrder = category.SortOrder,
            }, "Category updated."));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tenantId = _tenantContext.TenantId ?? 1;
            var category = await _context.ComplaintCategories
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (category is null)
                return NotFound(ApiResponse<bool>.NotFound($"Category #{id} not found."));

            _context.ComplaintCategories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Ok(true, "Category deleted."));
        }
    }
}
