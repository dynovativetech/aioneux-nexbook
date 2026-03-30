using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingPlatform.Api.Controllers
{
    /// <summary>SuperAdmin-only CRUD for global document type definitions (e.g. "Trade License").</summary>
    [ApiController]
    [Route("api/document-types")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public class DocumentTypesController : ControllerBase
    {
        private readonly IDocumentService _service;
        public DocumentTypesController(IDocumentService service) => _service = service;

        [HttpGet]
        [AllowAnonymous] // tenants need to read these too to show the upload UI
        public async Task<IActionResult> GetAll()
            => Ok(await _service.GetDocumentTypesAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDocumentTypeRequest request)
        {
            var result = await _service.CreateDocumentTypeAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateDocumentTypeRequest request)
        {
            var result = await _service.UpdateDocumentTypeAsync(id, request);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteDocumentTypeAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }
    }
}
