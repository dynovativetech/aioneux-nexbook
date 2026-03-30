using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext  _context;
        private readonly ITenantContext _tenantContext;

        public UsersController(AppDbContext context, ITenantContext tenantContext)
        {
            _context       = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.TenantAdmin}")]
        public IActionResult GetAll()
        {
            var users = _context.Users.ToList();
            return Ok(users);
        }

        /// <summary>Search users within the tenant by email and optional role filter.</summary>
        [HttpGet("search")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Search([FromQuery] string? email, [FromQuery] string? role)
        {
            var q = _context.Users.AsQueryable();

            if (!_tenantContext.IsSuperAdmin)
                q = q.Where(u => u.TenantId == _tenantContext.TenantId);

            if (!string.IsNullOrWhiteSpace(email))
                q = q.Where(u => u.Email.Contains(email));

            if (!string.IsNullOrWhiteSpace(role))
                q = q.Where(u => u.Role == role);

            var results = await q
                .Select(u => new { u.Id, u.FullName, u.Email, u.Role })
                .Take(10)
                .ToListAsync();

            return Ok(results);
        }

        /// <summary>
        /// Creates a FacilityOrganizer user account and returns the new user ID.
        /// The generated password is returned once so the admin can share it.
        /// </summary>
        [HttpPost("invite-organizer")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> InviteOrganizer([FromBody] InviteOrganizerRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email))
                return BadRequest(ApiResponse<object>.Fail("Email is required."));

            if (await _context.Users.AnyAsync(u => u.Email == req.Email))
                return BadRequest(ApiResponse<object>.Fail("A user with this email already exists. Use 'Search' to find them."));

            var tenantId = _tenantContext.TenantId ?? 1;
            var password = GeneratePassword();

            var user = new User
            {
                TenantId     = tenantId,
                FullName     = req.FullName?.Trim() ?? req.Email,
                Email        = req.Email.Trim().ToLowerInvariant(),
                PasswordHash = PasswordHelper.Hash(password),
                Role         = Roles.FacilityOrganizer,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<InviteOrganizerResponse>.Ok(new InviteOrganizerResponse
            {
                UserId       = user.Id,
                Email        = user.Email,
                FullName     = user.FullName,
                TempPassword = password
            }, "Organizer account created. Share the temporary password with them."));
        }

        [HttpPost]
        public IActionResult Create(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges();
            return Ok(user);
        }

        private static string GeneratePassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
            var rng = new Random();
            return new string(Enumerable.Range(0, 10).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        }
    }
}
