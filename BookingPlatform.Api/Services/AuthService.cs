using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BookingPlatform.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext      _context;
        private readonly IConfiguration   _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config  = config;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var email = request.Email.Trim().ToLower();

            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
                return AuthResponse.Fail("An account with this email already exists.");

            var role = email.StartsWith("admin") ? Roles.TenantAdmin : Roles.Customer;

            int? tenantIdForNewUser = null;
            if (role == Roles.Customer)
            {
                var defaultTenant = await _context.Tenants.OrderBy(t => t.Id).FirstOrDefaultAsync();
                tenantIdForNewUser = defaultTenant?.Id;
            }

            var user = new User
            {
                FullName     = request.FullName.Trim(),
                Email        = email,
                PasswordHash = PasswordHelper.Hash(request.Password),
                Role         = role,
                TenantId     = tenantIdForNewUser,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return IssueToken(user);
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var email = request.Email.Trim().ToLower();
            var user  = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            if (user is null || string.IsNullOrEmpty(user.PasswordHash))
                return AuthResponse.Fail("Invalid email or password.");

            if (!PasswordHelper.Verify(request.Password, user.PasswordHash))
                return AuthResponse.Fail("Invalid email or password.");

            if (!user.IsActive)
                return AuthResponse.Fail("This account has been deactivated. Contact your administrator.");

            return IssueToken(user);
        }

        public async Task<ApiResponse<UserProfileDto>> GetProfileAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return ApiResponse<UserProfileDto>.NotFound($"User #{userId} not found.");

            return ApiResponse<UserProfileDto>.Ok(MapToProfile(user));
        }

        public async Task<ApiResponse<UserProfileDto>> UpdateProfileAsync(int userId, UpdateProfileRequest req)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return ApiResponse<UserProfileDto>.NotFound($"User #{userId} not found.");

            if (!string.IsNullOrWhiteSpace(req.FirstName))
                user.FirstName = req.FirstName.Trim();
            if (!string.IsNullOrWhiteSpace(req.LastName))
                user.LastName = req.LastName.Trim();

            // Derive FullName from FirstName + LastName for backward compatibility
            var parts    = new[] { user.FirstName, user.LastName }.Where(s => !string.IsNullOrWhiteSpace(s));
            var fullName = string.Join(" ", parts);
            if (!string.IsNullOrWhiteSpace(fullName))
                user.FullName = fullName;

            user.PhoneNumber = req.PhoneNumber?.Trim();
            user.Address     = req.Address?.Trim();
            user.City        = req.City?.Trim();
            user.State       = req.State?.Trim();
            user.CountryName = req.CountryName?.Trim();
            user.PostalCode  = req.PostalCode?.Trim();

            await _context.SaveChangesAsync();

            return ApiResponse<UserProfileDto>.Ok(MapToProfile(user), "Profile updated successfully.");
        }

        public async Task<ApiResponse<bool>> ChangePasswordAsync(ChangePasswordRequest req)
        {
            var user = await _context.Users.FindAsync(req.UserId);
            if (user is null)
                return ApiResponse<bool>.NotFound($"User #{req.UserId} not found.");

            if (string.IsNullOrEmpty(user.PasswordHash) || !PasswordHelper.Verify(req.CurrentPassword, user.PasswordHash))
                return ApiResponse<bool>.Fail("Current password is incorrect.");

            user.PasswordHash = PasswordHelper.Hash(req.NewPassword);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.Ok(true, "Password changed successfully.");
        }

        // ── private ──────────────────────────────────────────────────────────

        private static UserProfileDto MapToProfile(User u) => new()
        {
            UserId      = u.Id,
            FullName    = u.FullName,
            Email       = u.Email,
            FirstName   = u.FirstName,
            LastName    = u.LastName,
            PhoneNumber = u.PhoneNumber,
            Address     = u.Address,
            City        = u.City,
            State       = u.State,
            CountryName = u.CountryName,
            PostalCode  = u.PostalCode,
        };

        private AuthResponse IssueToken(User user)
        {
            var key      = _config["Jwt:Key"]
                           ?? throw new InvalidOperationException("Jwt:Key is missing from appsettings.json.");
            var issuer   = _config["Jwt:Issuer"]
                           ?? throw new InvalidOperationException("Jwt:Issuer is missing from appsettings.json.");
            var audience = _config["Jwt:Audience"]
                           ?? throw new InvalidOperationException("Jwt:Audience is missing from appsettings.json.");
            var expiryHrs = int.Parse(_config["Jwt:ExpiryHours"] ?? "24");

            var secKey  = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var creds   = new SigningCredentials(secKey, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddHours(expiryHrs);

            var claimsList = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name,               user.FullName),
                new Claim(ClaimTypes.Role,               user.Role),
                new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            };

            if (user.TenantId.HasValue)
                claimsList.Add(new Claim("tenantId", user.TenantId.Value.ToString()));

            var claims = claimsList.ToArray();

            var token = new JwtSecurityToken(
                issuer:            issuer,
                audience:          audience,
                claims:            claims,
                expires:           expires,
                signingCredentials: creds);

            return AuthResponse.Ok(
                new JwtSecurityTokenHandler().WriteToken(token),
                user.Id, user.FullName, user.Email, user.Role, user.TenantId, expires);
        }
    }
}
