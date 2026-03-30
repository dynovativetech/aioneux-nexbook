using BookingPlatform.Api.DTOs;
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

        // ── GET all (admin) ──────────────────────────────────────────────────

        /// <summary>Admin: retrieve all complaints across all users.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var response = await _complaintService.GetAllAsync();
            return Ok(response);
        }

        // ── GET by id ────────────────────────────────────────────────────────

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var response = await _complaintService.GetByIdAsync(id);
            if (!response.Success)
                return NotFound(response);

            return Ok(response);
        }

        // ── GET by user ──────────────────────────────────────────────────────

        /// <summary>Return all complaints submitted by a specific user.</summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var response = await _complaintService.GetByUserAsync(userId);
            if (!response.Success)
                return NotFound(response);

            return Ok(response);
        }

        // ── POST create ──────────────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateComplaintRequest request)
        {
            var response = await _complaintService.CreateAsync(request);
            if (!response.Success)
                return BadRequest(response);

            return CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response);
        }

        // ── PATCH status (admin) ─────────────────────────────────────────────

        /// <summary>Admin: update the status of a complaint, with an optional note.</summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id, [FromBody] UpdateComplaintStatusRequest request)
        {
            var response = await _complaintService.UpdateStatusAsync(id, request);
            if (!response.Success)
                return response.Message.Contains("not found")
                    ? NotFound(response)
                    : BadRequest(response);

            return Ok(response);
        }

        // ── POST comment ─────────────────────────────────────────────────────

        /// <summary>Add a comment to an existing complaint (user or admin).</summary>
        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(
            int id, [FromBody] AddCommentRequest request)
        {
            var response = await _complaintService.AddCommentAsync(id, request);
            if (!response.Success)
                return response.Message.Contains("not found")
                    ? NotFound(response)
                    : BadRequest(response);

            return Ok(response);
        }
    }
}
