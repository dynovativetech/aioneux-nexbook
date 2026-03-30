using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AvailabilityController : ControllerBase
    {
        private readonly IAvailabilityService _availabilityService;

        public AvailabilityController(IAvailabilityService availabilityService)
        {
            _availabilityService = availabilityService;
        }

        /// <summary>
        /// Returns available time slots for a facility on a given date.
        /// Optionally filter by instructor availability.
        /// </summary>
        /// <remarks>
        /// Example:
        ///
        ///     GET /api/availability?facilityId=1&amp;date=2026-04-01&amp;slotDurationMinutes=60
        ///     GET /api/availability?facilityId=1&amp;date=2026-04-01&amp;slotDurationMinutes=30&amp;instructorId=1
        ///
        /// </remarks>
        [HttpGet]
        public async Task<IActionResult> GetAvailableSlots([FromQuery] AvailabilityRequest request)
        {
            var response = await _availabilityService.GetAvailableSlotsAsync(request);

            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }
    }
}
