using BookingPlatform.Api.DTOs;

namespace BookingPlatform.Api.Services
{
    public interface IAvailabilityService
    {
        /// <summary>
        /// Returns all available time slots for a facility on a given date.
        /// If InstructorId is supplied, only slots where the instructor is also free are included.
        /// </summary>
        Task<ApiResponse<AvailabilityResponse>> GetAvailableSlotsAsync(AvailabilityRequest request);
    }
}
