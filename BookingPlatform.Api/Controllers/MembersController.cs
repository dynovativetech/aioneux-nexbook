using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    /// <summary>Tenant admin — manage member portal users (Customer role) for the current tenant.</summary>
    [ApiController]
    [Route("api/admin/members")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public class MembersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public MembersController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var q = await GetTenantMembersQueryAsync();
            var list = await q
                .OrderBy(u => u.FullName)
                .Select(u => new AdminMemberListDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    PhoneNumber = u.PhoneNumber,
                    LandlinePhone = u.LandlinePhone,
                    City = u.City,
                    CountryName = u.CountryName,
                    AreaId = u.AreaId,
                    AreaName = u.Area != null ? u.Area.Name : null,
                    CommunityId = u.CommunityId,
                    CommunityName = u.Community != null ? u.Community.Name : null,
                    IsActive = u.IsActive,
                })
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var q = await GetTenantMembersQueryAsync();
            var u = await q.FirstOrDefaultAsync(x => x.Id == id);
            if (u is null) return NotFound(ApiResponse<object>.Fail("Member not found."));

            var dto = new AdminMemberDetailDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                PhoneNumber = u.PhoneNumber,
                LandlinePhone = u.LandlinePhone,
                ApartmentOrVillaNumber = u.ApartmentOrVillaNumber,
                StreetAddress = u.StreetAddress,
                City = u.City,
                State = u.State,
                CountryName = u.CountryName,
                Emirate = u.Emirate,
                PostalCode = u.PostalCode,
                AreaId = u.AreaId,
                AreaName = u.Area?.Name,
                CommunityId = u.CommunityId,
                CommunityName = u.Community?.Name,
                IsActive = u.IsActive,
            };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMemberRequest req)
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return BadRequest(ApiResponse<object>.Fail("Tenant context is missing."));

            var email = req.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
                return BadRequest(ApiResponse<object>.Fail("A user with this email already exists."));

            var isUae = req.CountryName.Trim().Equals("United Arab Emirates", StringComparison.OrdinalIgnoreCase)
                        || req.CountryName.Trim().Equals("UAE", StringComparison.OrdinalIgnoreCase);
            if (isUae && string.IsNullOrWhiteSpace(req.Emirate))
                return BadRequest(ApiResponse<object>.Fail("Emirate is required for United Arab Emirates."));

            var tempPassword = GeneratePassword();
            var user = new User
            {
                TenantId = tid.Value,
                Role = Roles.Customer,
                FullName = $"{req.FirstName} {req.LastName}".Trim(),
                Email = email,
                FirstName = req.FirstName.Trim(),
                LastName = req.LastName.Trim(),
                PhoneNumber = req.PhoneNumber.Trim(),
                LandlinePhone = string.IsNullOrWhiteSpace(req.LandlinePhone) ? null : req.LandlinePhone.Trim(),
                ApartmentOrVillaNumber = string.IsNullOrWhiteSpace(req.ApartmentOrVillaNumber) ? null : req.ApartmentOrVillaNumber.Trim(),
                StreetAddress = req.StreetAddress.Trim(),
                City = req.City.Trim(),
                State = req.State.Trim(),
                CountryName = req.CountryName.Trim(),
                Emirate = string.IsNullOrWhiteSpace(req.Emirate) ? null : req.Emirate.Trim(),
                PostalCode = string.IsNullOrWhiteSpace(req.PostalCode) ? null : req.PostalCode.Trim(),
                AreaId = req.AreaId,
                CommunityId = req.CommunityId,
                PasswordHash = PasswordHelper.Hash(tempPassword),
                IsActive = true,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<CreateMemberResponse>.Ok(new CreateMemberResponse
            {
                UserId = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                TempPassword = tempPassword,
            }, "Member created. Share the temporary password with them."));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMemberRequest req)
        {
            var q = await GetTenantMembersQueryAsync();
            var user = await q.FirstOrDefaultAsync(u => u.Id == id);
            if (user is null) return NotFound(ApiResponse<object>.Fail("Member not found."));

            var email = req.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == email))
                return BadRequest(ApiResponse<object>.Fail("Another user already uses this email."));

            var isUae = req.CountryName.Trim().Equals("United Arab Emirates", StringComparison.OrdinalIgnoreCase)
                        || req.CountryName.Trim().Equals("UAE", StringComparison.OrdinalIgnoreCase);
            if (isUae && string.IsNullOrWhiteSpace(req.Emirate))
                return BadRequest(ApiResponse<object>.Fail("Emirate is required for United Arab Emirates."));

            user.FullName = $"{req.FirstName} {req.LastName}".Trim();
            user.Email = email;
            user.FirstName = req.FirstName.Trim();
            user.LastName = req.LastName.Trim();
            user.PhoneNumber = req.PhoneNumber.Trim();
            user.LandlinePhone = string.IsNullOrWhiteSpace(req.LandlinePhone) ? null : req.LandlinePhone.Trim();
            user.ApartmentOrVillaNumber = string.IsNullOrWhiteSpace(req.ApartmentOrVillaNumber) ? null : req.ApartmentOrVillaNumber.Trim();
            user.StreetAddress = req.StreetAddress.Trim();
            user.City = req.City.Trim();
            user.State = req.State.Trim();
            user.CountryName = req.CountryName.Trim();
            user.Emirate = string.IsNullOrWhiteSpace(req.Emirate) ? null : req.Emirate.Trim();
            user.PostalCode = string.IsNullOrWhiteSpace(req.PostalCode) ? null : req.PostalCode.Trim();
            user.AreaId = req.AreaId;
            user.CommunityId = req.CommunityId;
            user.IsActive = req.IsActive;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Member updated."));
        }

        /// <summary>Soft-delete: sets member inactive (cannot sign in).</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var q = await GetTenantMembersQueryAsync();
            var user = await q.FirstOrDefaultAsync(u => u.Id == id);
            if (user is null) return NotFound(ApiResponse<object>.Fail("Member not found."));

            user.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.Ok("ok", "Member deactivated."));
        }

        [HttpPost("{id:int}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id)
        {
            var q = await GetTenantMembersQueryAsync();
            var user = await q.FirstOrDefaultAsync(u => u.Id == id);
            if (user is null) return NotFound(ApiResponse<object>.Fail("Member not found."));

            var tempPassword = GeneratePassword();
            user.PasswordHash = PasswordHelper.Hash(tempPassword);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<ResetMemberPasswordResponse>.Ok(new ResetMemberPasswordResponse
            {
                UserId = user.Id,
                TempPassword = tempPassword,
            }, "Password reset. Share the new temporary password with the member."));
        }

        private async Task<int?> ResolveTenantIdAsync()
        {
            var tid = _tenantContext.TenantId;
            if (!tid.HasValue && _tenantContext.UserId > 0)
            {
                var me = await _context.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == _tenantContext.UserId);
                tid = me?.TenantId;
            }
            return tid;
        }

        private async Task<IQueryable<User>> GetTenantMembersQueryAsync()
        {
            var tid = await ResolveTenantIdAsync();
            if (!tid.HasValue)
                return _context.Users.Where(_ => false);

            var firstId = await _context.Tenants.OrderBy(t => t.Id).Select(t => t.Id).FirstOrDefaultAsync();
            var single = await _context.Tenants.CountAsync() == 1;

            return _context.Users
                .Include(u => u.Area)
                .Include(u => u.Community)
                .Where(u =>
                u.Role == Roles.Customer &&
                (u.TenantId == tid || (single && u.TenantId == null && tid == firstId)));
        }

        private static string GeneratePassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
            var rng = new Random();
            return new string(Enumerable.Range(0, 12).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        }
    }
}
