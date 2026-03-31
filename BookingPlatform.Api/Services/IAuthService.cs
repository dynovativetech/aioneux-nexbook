using BookingPlatform.Api.DTOs;

namespace BookingPlatform.Api.Services
{
    public interface IAuthService
    {
        Task<AuthResponse>                RegisterAsync(RegisterRequest request);
        Task<AuthResponse>                LoginAsync(LoginRequest request);
        Task<ApiResponse<UserProfileDto>> GetProfileAsync(int userId);
        Task<ApiResponse<UserProfileDto>> UpdateProfileAsync(int userId, UpdateProfileRequest request);
        Task<ApiResponse<bool>>           ChangePasswordAsync(ChangePasswordRequest request);
    }
}
