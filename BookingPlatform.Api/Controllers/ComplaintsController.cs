using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComplaintsController : ControllerBase
    {
        private readonly IComplaintService _complaintService;

        public ComplaintsController(IComplaintService complaintService)
        {
            _complaintService = complaintService;
        }

        // ── GET all (admin) — supports optional query-string filters ─────────
        // GET /api/complaints?status=Open&category=Technical&search=pool&dateFrom=2026-01-01&dateTo=2026-03-31&userId=5

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] ComplaintStatus? status,
            [FromQuery] string?          category,
            [FromQuery] string?          search,
            [FromQuery] DateTime?        dateFrom,
            [FromQuery] DateTime?        dateTo,
            [FromQuery] int?             userId)
        {
            var filter = (status == null && category == null && search == null
                          && dateFrom == null && dateTo == null && userId == null)
                ? null
                : new ComplaintFilterRequest
                  {
                      Status   = status,
                      Category = category,
                      Search   = search,
                      DateFrom = dateFrom,
                      DateTo   = dateTo,
                      UserId   = userId,
                  };

            var response = await _complaintService.GetAllAsync(filter);
            return Ok(response);
        }

        // ── GET by id ────────────────────────────────────────────────────────

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var response = await _complaintService.GetByIdAsync(id);
            return response.Success ? Ok(response) : NotFound(response);
        }

        // ── GET by user ──────────────────────────────────────────────────────

        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var response = await _complaintService.GetByUserAsync(userId);
            return response.Success ? Ok(response) : NotFound(response);
        }

        // ── POST create (multipart/form-data so images can be included) ──────

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateComplaintRequest request)
        {
            var images   = Request.Form.Files.Count > 0 ? Request.Form.Files : null;
            var response = await _complaintService.CreateAsync(request, images);
            if (!response.Success)
                return BadRequest(response);

            return CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response);
        }

        // Also accept plain JSON for API clients that don't need image upload
        [HttpPost("json")]
        public async Task<IActionResult> CreateJson([FromBody] CreateComplaintRequest request)
        {
            var response = await _complaintService.CreateAsync(request, null);
            if (!response.Success)
                return BadRequest(response);

            return CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response);
        }

        // ── PATCH status (admin) ─────────────────────────────────────────────

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id, [FromBody] UpdateComplaintStatusRequest request)
        {
            var response = await _complaintService.UpdateStatusAsync(id, request);
            return response.Success ? Ok(response) : response.ErrorKind switch
            {
                ApiErrorKind.NotFound => NotFound(response),
                _                    => BadRequest(response),
            };
        }

        // ── POST comment (multipart/form-data for optional image attachment) ──

        [HttpPost("{id:int}/comments")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> AddComment(
            int id, [FromForm] AddCommentRequest request)
        {
            var image    = Request.Form.Files.Count > 0 ? Request.Form.Files[0] : null;
            var response = await _complaintService.AddCommentAsync(id, request, image);
            return response.Success ? Ok(response) : response.ErrorKind switch
            {
                ApiErrorKind.NotFound => NotFound(response),
                _                    => BadRequest(response),
            };
        }

        // Also accept JSON comments (no image)
        [HttpPost("{id:int}/comments/json")]
        public async Task<IActionResult> AddCommentJson(
            int id, [FromBody] AddCommentRequest request)
        {
            var response = await _complaintService.AddCommentAsync(id, request, null);
            return response.Success ? Ok(response) : response.ErrorKind switch
            {
                ApiErrorKind.NotFound => NotFound(response),
                _                    => BadRequest(response),
            };
        }
    }
}
