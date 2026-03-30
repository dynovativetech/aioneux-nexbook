using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService  _authService;
        private readonly IAuditService _audit;

        public AuthController(IAuthService authService, IAuditService audit)
        {
            _authService = authService;
            _audit       = audit;
        }

        /// <summary>Register a new account. Returns a JWT on success.</summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var result = await _authService.RegisterAsync(request);
                if (result.Success)
                {
                    await _audit.LogAsync("Register", "User", result.UserId,
                        result.Email, $"New account registered: {result.Email} (role: {result.Role}).");
                }
                else
                {
                    await _audit.LogAsync("FailedRegister", "User", null,
                        request.Email, $"Registration attempt failed for {request.Email}: {result.Message}");
                }
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, AuthResponse.Fail($"Registration failed: {ex.Message}"));
            }
        }

        /// <summary>Login with email + password. Returns a JWT on success.</summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                if (result.Success)
                {
                    await _audit.LogAsync("Login", "User", result.UserId,
                        result.Email, $"Successful login for {result.Email}.");
                }
                else
                {
                    await _audit.LogAsync("FailedLogin", "User", null,
                        request.Email, $"Failed login attempt for {request.Email}.");
                }
                // Use 400 (not 401) so the Axios 401-interceptor does not swallow the error message.
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, AuthResponse.Fail($"Login failed: {ex.Message}"));
            }
        }
    }
}
