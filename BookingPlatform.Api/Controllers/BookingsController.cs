using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        // ════════════════════════════════════════════════════════════════════
        // Queries
        // ════════════════════════════════════════════════════════════════════

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var response = await _bookingService.GetAllAsync();
            return Ok(response);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var response = await _bookingService.GetByIdAsync(id);
            return ToResult(response);
        }

        // ════════════════════════════════════════════════════════════════════
        // Advanced creation endpoints
        // ════════════════════════════════════════════════════════════════════

        /// <summary>POST /api/bookings/single — single-person, single-slot booking.</summary>
        [HttpPost("single")]
        public async Task<IActionResult> CreateSingle([FromBody] CreateBookingRequest request)
        {
            var response = await _bookingService.CreateSingleBookingAsync(request);
            return response.Success
                ? CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response)
                : ToResult(response);
        }

        /// <summary>
        /// POST /api/bookings/group — group booking with multiple named participants.
        /// ParticipantCount must be ≥ 2 and ≤ Facility.Capacity.
        /// </summary>
        [HttpPost("group")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupBookingRequest request)
        {
            var response = await _bookingService.CreateGroupBookingAsync(request);
            return response.Success
                ? CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response)
                : ToResult(response);
        }

        /// <summary>
        /// POST /api/bookings/multi-slot — one booking spanning multiple non-contiguous slots.
        /// All slots are validated and written atomically (all-or-nothing).
        /// </summary>
        [HttpPost("multi-slot")]
        public async Task<IActionResult> CreateMultiSlot([FromBody] CreateMultiSlotBookingRequest request)
        {
            var response = await _bookingService.CreateMultiSlotBookingAsync(request);
            return response.Success
                ? CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response)
                : ToResult(response);
        }

        // ════════════════════════════════════════════════════════════════════
        // Legacy creation (backward-compatible)
        // POST /api/bookings  →  delegates to CreateSingleBookingAsync
        // ════════════════════════════════════════════════════════════════════

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
        {
            var response = await _bookingService.CreateAsync(request);
            return response.Success
                ? CreatedAtAction(nameof(GetById), new { id = response.Data!.Id }, response)
                : ToResult(response);
        }

        // ════════════════════════════════════════════════════════════════════
        // Mutation
        // ════════════════════════════════════════════════════════════════════

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateBookingRequest request)
        {
            var response = await _bookingService.UpdateAsync(id, request);
            return ToResult(response);
        }

        /// <summary>
        /// POST /api/bookings/{id}/cancel
        /// Cancels the booking and releases all its facility and instructor reservations.
        /// </summary>
        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var response = await _bookingService.CancelBookingAsync(id);
            return ToResult(response);
        }

        /// <summary>PATCH /api/bookings/{id}/cancel — backward-compatible alias.</summary>
        [HttpPatch("{id:int}/cancel")]
        public Task<IActionResult> CancelPatch(int id) => Cancel(id);

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var response = await _bookingService.DeleteAsync(id);
            return ToResult(response);
        }

        // ════════════════════════════════════════════════════════════════════
        // Availability
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// GET /api/bookings/availability/facility
        /// Available time slots for a facility on a given date.
        /// Uses FacilityReservation table — more accurate than the legacy AvailabilityController.
        /// </summary>
        [HttpGet("availability/facility")]
        public async Task<IActionResult> FacilityAvailability(
            [FromQuery] FacilityAvailabilityRequest request)
        {
            var response = await _bookingService.GetAvailableFacilitySlotsAsync(request);
            return ToResult(response);
        }

        /// <summary>
        /// GET /api/bookings/availability/instructor
        /// Available time slots for an instructor on a given date.
        /// Uses InstructorReservation table.
        /// </summary>
        [HttpGet("availability/instructor")]
        public async Task<IActionResult> InstructorAvailability(
            [FromQuery] InstructorAvailabilityRequest request)
        {
            var response = await _bookingService.GetAvailableInstructorSlotsAsync(request);
            return ToResult(response);
        }

        // ════════════════════════════════════════════════════════════════════
        // Response-to-IActionResult mapping
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Maps an ApiResponse to the appropriate HTTP status code using the typed
        /// <see cref="ApiErrorKind"/>.  This replaces the previous brittle pattern of
        /// inspecting the human-readable message string for keywords like "not found".
        /// </summary>
        private IActionResult ToResult<T>(ApiResponse<T> response) =>
            response.Success
                ? Ok(response)
                : response.ErrorKind switch
                {
                    ApiErrorKind.NotFound  => NotFound(response),
                    ApiErrorKind.Conflict  => Conflict(response),
                    ApiErrorKind.Forbidden => Forbid(),
                    _                      => BadRequest(response),
                };
    }
}
