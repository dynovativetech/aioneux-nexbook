using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _service;

        public LocationController(ILocationService service)
        {
            _service = service;
        }

        // ── Countries (public read, SuperAdmin write) ─────────────────────────

        [HttpGet("countries")]
        public async Task<IActionResult> GetCountries()
        {
            var result = await _service.GetCountriesAsync();
            return Ok(result);
        }

        [HttpPost("countries")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> CreateCountry([FromBody] CreateCountryRequest request)
        {
            var result = await _service.CreateCountryAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Cities ────────────────────────────────────────────────────────────

        [HttpGet("cities")]
        public async Task<IActionResult> GetCities([FromQuery] int countryId)
        {
            var result = await _service.GetCitiesAsync(countryId);
            return Ok(result);
        }

        [HttpPost("cities")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> CreateCity([FromBody] CreateCityRequest request)
        {
            var result = await _service.CreateCityAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Areas (tenant-scoped) ─────────────────────────────────────────────

        [HttpGet("areas")]
        [Authorize]
        public async Task<IActionResult> GetAreas([FromQuery] int cityId)
        {
            var result = await _service.GetAreasAsync(cityId);
            return Ok(result);
        }

        [HttpPost("areas")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> CreateArea([FromBody] CreateAreaRequest request)
        {
            var result = await _service.CreateAreaAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Communities (tenant-scoped) ───────────────────────────────────────

        [HttpGet("communities")]
        [Authorize]
        public async Task<IActionResult> GetCommunities([FromQuery] int? areaId = null)
        {
            var result = await _service.GetCommunitiesAsync(areaId);
            return Ok(result);
        }

        [HttpPost("communities")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> CreateCommunity([FromBody] CreateCommunityRequest request)
        {
            var result = await _service.CreateCommunityAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("communities/{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> UpdateCommunity(int id, [FromBody] CreateCommunityRequest request)
        {
            var result = await _service.UpdateCommunityAsync(id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("communities/{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> DeleteCommunity(int id)
        {
            var result = await _service.DeleteCommunityAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Venues (tenant-scoped) ────────────────────────────────────────────

        [HttpGet("venues")]
        [Authorize]
        public async Task<IActionResult> GetVenues([FromQuery] int communityId)
        {
            var result = await _service.GetVenuesAsync(communityId);
            return Ok(result);
        }

        [HttpPost("venues")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> CreateVenue([FromBody] CreateVenueRequest request)
        {
            var result = await _service.CreateVenueAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
