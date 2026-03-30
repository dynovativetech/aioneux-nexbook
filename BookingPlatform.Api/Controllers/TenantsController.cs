using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public class TenantsController : ControllerBase
    {
        private readonly ITenantService _service;
        private readonly IDocumentService _docs;

        public TenantsController(ITenantService service, IDocumentService docs)
        {
            _service = service;
            _docs    = docs;
        }

        // ── Tenant CRUD ───────────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTenantRequest request)
        {
            var result = await _service.CreateAsync(request);
            return result.Success
                ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
                : BadRequest(result);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTenantRequest request)
        {
            try
            {
                var result = await _service.UpdateAsync(id, request);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:int}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var result = await _service.ToggleActiveAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        // ── Payment settings ──────────────────────────────────────────────────

        [HttpGet("{id:int}/payment-settings")]
        public async Task<IActionResult> GetPaymentSettings(int id)
        {
            var result = await _service.GetPaymentSettingsAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPut("{id:int}/payment-settings")]
        public async Task<IActionResult> UpdatePaymentSettings(int id, [FromBody] PaymentSettingsDto dto)
        {
            try
            {
                var result = await _service.UpdatePaymentSettingsAsync(id, dto);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ── Logo upload ───────────────────────────────────────────────────────

        [HttpPost("{id:int}/logo")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadLogo(int id, IFormFile file)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { success = false, message = "No file provided." });

            var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            var dir = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "logos");
            Directory.CreateDirectory(dir);

            var stored  = $"{id}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var path    = Path.Combine(dir, stored);
            await using var s = System.IO.File.Create(path);
            await file.CopyToAsync(s);

            var url    = $"/uploads/logos/{stored}";
            var tenant = await HttpContext.RequestServices
                .GetRequiredService<BookingPlatform.Api.Data.AppDbContext>()
                .Tenants.FindAsync(id);
            if (tenant is not null) { tenant.LogoUrl = url; }
            await HttpContext.RequestServices
                .GetRequiredService<BookingPlatform.Api.Data.AppDbContext>()
                .SaveChangesAsync();

            return Ok(new { success = true, logoUrl = url });
        }

        // ── Documents ─────────────────────────────────────────────────────────

        [HttpGet("{id:int}/documents")]
        public async Task<IActionResult> GetDocuments(int id)
            => Ok(await _docs.GetTenantDocumentsAsync(id));

        [HttpPost("{id:int}/documents")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDocument(
            int id,
            [FromForm] int documentTypeId,
            IFormFile file,
            [FromForm] string? notes)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { success = false, message = "No file provided." });

            var result = await _docs.UploadDocumentAsync(id, documentTypeId, file, notes);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id:int}/documents/{docId:int}")]
        public async Task<IActionResult> DeleteDocument(int id, int docId)
        {
            var result = await _docs.DeleteDocumentAsync(id, docId);
            return result.Success ? Ok(result) : NotFound(result);
        }
    }
}
