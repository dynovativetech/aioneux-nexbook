using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public class TenantService : ITenantService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _email;

        public TenantService(AppDbContext context, IEmailService email)
        {
            _context = context;
            _email   = email;
        }

        // ── Queries ───────────────────────────────────────────────────────────

        public async Task<ApiResponse<List<TenantResponse>>> GetAllAsync()
        {
            var tenants = await _context.Tenants
                .AsNoTracking()
                .Include(t => t.DefaultCountry)
                .OrderBy(t => t.Name)
                .ToListAsync();

            return ApiResponse<List<TenantResponse>>.Ok(tenants.Select(Map).ToList());
        }

        public async Task<ApiResponse<TenantResponse>> GetByIdAsync(int id)
        {
            var tenant = await _context.Tenants
                .Include(t => t.DefaultCountry)
                .Include(t => t.ContactCountry)
                .FirstOrDefaultAsync(t => t.Id == id);

            return tenant is null
                ? ApiResponse<TenantResponse>.Fail($"Tenant {id} not found.")
                : ApiResponse<TenantResponse>.Ok(Map(tenant));
        }

        // ── Create ────────────────────────────────────────────────────────────

        public async Task<ApiResponse<CreateTenantResponse>> CreateAsync(CreateTenantRequest request)
        {
            if (await _context.Tenants.AnyAsync(t => t.Slug == request.Slug))
                return ApiResponse<CreateTenantResponse>.Fail($"Slug '{request.Slug}' is already in use.");

            // 1. Persist the tenant
            var tenant = new Tenant
            {
                Name               = request.Name.Trim(),
                Slug               = request.Slug.Trim().ToLower(),
                LoginUrl           = request.LoginUrl?.Trim(),
                ContactEmail       = request.ContactEmail.Trim().ToLower(),
                ContactPhone       = request.ContactPhone?.Trim(),
                CompanyMobile      = request.CompanyMobile?.Trim(),
                Website            = request.Website?.Trim(),
                LogoUrl            = request.LogoUrl?.Trim(),
                TRN                = request.TRN?.Trim(),
                DefaultCountryId   = request.DefaultCountryId,
                StateProvince      = request.StateProvince?.Trim(),
                DefaultCityText    = request.DefaultCityText?.Trim(),
                Street             = request.Street?.Trim(),
                PostalCode         = request.PostalCode?.Trim(),
                ContactTitle         = request.ContactTitle?.Trim(),
                ContactFirstName     = request.ContactFirstName?.Trim(),
                ContactLastName      = request.ContactLastName?.Trim(),
                ContactMobilePhone   = request.ContactMobilePhone?.Trim(),
                ContactPersonEmail   = request.ContactPersonEmail?.Trim().ToLower(),
                ContactCountryId     = request.ContactCountryId,
                ContactState       = request.ContactState?.Trim(),
                ContactCityText    = request.ContactCityText?.Trim(),
                ContactStreet      = request.ContactStreet?.Trim(),
                ContactPostalCode  = request.ContactPostalCode?.Trim(),
                IsActive           = true,
                CreatedAt          = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            // 2. Persist payment settings
            var ps = request.PaymentSettings ?? new PaymentSettingsDto();
            _context.TenantPaymentSettings.Add(new TenantPaymentSettings
            {
                TenantId           = tenant.Id,
                AcceptCash         = ps.AcceptCash,
                AcceptOnline       = ps.AcceptOnline,
                CcAvenueEnabled    = ps.CcAvenueEnabled,
                CcAvenueMerchantId = ps.CcAvenueMerchantId,
                CcAvenueAccessCode = ps.CcAvenueAccessCode,
                CcAvenueWorkingKey = ps.CcAvenueWorkingKey,
                MagnatiEnabled     = ps.MagnatiEnabled,
                MagnatiApiKey      = ps.MagnatiApiKey,
                MagnatiMerchantId  = ps.MagnatiMerchantId,
                MagnatiSecretKey   = ps.MagnatiSecretKey
            });

            // 3. Clone template areas (TenantId = 1) into the new tenant
            const int templateTenantId = 1;
            if (tenant.Id != templateTenantId)
            {
                var templateAreas = await _context.Areas
                    .AsNoTracking()
                    .Where(a => a.TenantId == templateTenantId)
                    .Include(a => a.Communities)
                    .IgnoreQueryFilters()
                    .ToListAsync();

                foreach (var templateArea in templateAreas)
                {
                    var newArea = new Area
                    {
                        CityId   = templateArea.CityId,
                        TenantId = tenant.Id,
                        Name     = templateArea.Name
                    };
                    _context.Areas.Add(newArea);
                    await _context.SaveChangesAsync();

                    foreach (var c in templateArea.Communities)
                    {
                        _context.Communities.Add(new Community
                        {
                            AreaId      = newArea.Id,
                            TenantId    = tenant.Id,
                            Name        = c.Name,
                            Description = c.Description
                        });
                    }
                }
            }

            // 4. Auto-create TenantAdmin user
            //    Use ContactPersonEmail if provided, otherwise fall back to company ContactEmail
            var adminLoginEmail = !string.IsNullOrWhiteSpace(request.ContactPersonEmail)
                ? request.ContactPersonEmail.Trim().ToLower()
                : request.ContactEmail.Trim().ToLower();

            var tempPassword = Guid.NewGuid().ToString("N")[..10];
            var adminFullName = $"{request.ContactFirstName?.Trim()} {request.ContactLastName?.Trim()}".Trim();
            if (string.IsNullOrWhiteSpace(adminFullName)) adminFullName = tenant.Name + " Admin";

            _context.Users.Add(new User
            {
                FullName     = adminFullName,
                Email        = adminLoginEmail,
                PasswordHash = PasswordHelper.Hash(tempPassword),
                Role         = Roles.TenantAdmin,
                TenantId     = tenant.Id
            });

            await _context.SaveChangesAsync();

            // 5. Send welcome email if requested
            if (request.SendWelcomeEmail)
            {
                await _email.SendWelcomeEmailAsync(
                    toEmail:       adminLoginEmail,
                    toName:        adminFullName,
                    tenantName:    tenant.Name,
                    loginUrl:      tenant.LoginUrl ?? string.Empty,
                    tempPassword:  tempPassword);
            }

            await _context.Entry(tenant).Reference(t => t.DefaultCountry).LoadAsync();

            var response = MapCreate(tenant);
            response.TempPassword = tempPassword;
            return ApiResponse<CreateTenantResponse>.Ok(response, "Tenant created.");
        }

        // ── Update ────────────────────────────────────────────────────────────

        public async Task<ApiResponse<TenantResponse>> UpdateAsync(int id, UpdateTenantRequest request)
        {
            var tenant = await _context.Tenants
                .Include(t => t.DefaultCountry)
                .Include(t => t.ContactCountry)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant is null)
                return ApiResponse<TenantResponse>.Fail($"Tenant {id} not found.");

            tenant.Name               = request.Name?.Trim() ?? tenant.Name;
            tenant.LoginUrl           = request.LoginUrl?.Trim();
            tenant.ContactEmail       = request.ContactEmail?.Trim().ToLower() ?? tenant.ContactEmail;
            tenant.ContactPhone       = request.ContactPhone?.Trim();
            tenant.CompanyMobile      = request.CompanyMobile?.Trim();
            tenant.Website            = request.Website?.Trim();
            tenant.LogoUrl            = request.LogoUrl?.Trim();
            tenant.TRN                = request.TRN?.Trim();
            tenant.DefaultCountryId   = request.DefaultCountryId;
            tenant.StateProvince      = request.StateProvince?.Trim();
            tenant.DefaultCityText    = request.DefaultCityText?.Trim();
            tenant.Street             = request.Street?.Trim();
            tenant.PostalCode         = request.PostalCode?.Trim();
            tenant.ContactTitle         = request.ContactTitle?.Trim();
            tenant.ContactFirstName     = request.ContactFirstName?.Trim();
            tenant.ContactLastName      = request.ContactLastName?.Trim();
            tenant.ContactMobilePhone   = request.ContactMobilePhone?.Trim();
            tenant.ContactPersonEmail   = request.ContactPersonEmail?.Trim().ToLower();
            tenant.ContactCountryId     = request.ContactCountryId;
            tenant.ContactState       = request.ContactState?.Trim();
            tenant.ContactCityText    = request.ContactCityText?.Trim();
            tenant.ContactStreet      = request.ContactStreet?.Trim();
            tenant.ContactPostalCode  = request.ContactPostalCode?.Trim();

            await _context.SaveChangesAsync();
            return ApiResponse<TenantResponse>.Ok(Map(tenant), "Tenant updated.");
        }

        // ── Toggle active ─────────────────────────────────────────────────────

        public async Task<ApiResponse<TenantResponse>> ToggleActiveAsync(int id)
        {
            var tenant = await _context.Tenants
                .Include(t => t.DefaultCountry)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant is null)
                return ApiResponse<TenantResponse>.Fail($"Tenant {id} not found.");

            tenant.IsActive = !tenant.IsActive;
            await _context.SaveChangesAsync();

            return ApiResponse<TenantResponse>.Ok(Map(tenant),
                tenant.IsActive ? "Tenant activated." : "Tenant deactivated.");
        }

        // ── Payment settings ──────────────────────────────────────────────────

        public async Task<ApiResponse<PaymentSettingsDto>> GetPaymentSettingsAsync(int tenantId)
        {
            var s = await _context.TenantPaymentSettings.FindAsync(tenantId);
            return s is null
                ? ApiResponse<PaymentSettingsDto>.Fail($"Payment settings for tenant {tenantId} not found.")
                : ApiResponse<PaymentSettingsDto>.Ok(MapPayment(s));
        }

        public async Task<ApiResponse<PaymentSettingsDto>> UpdatePaymentSettingsAsync(int tenantId, PaymentSettingsDto dto)
        {
            var s = await _context.TenantPaymentSettings.FindAsync(tenantId);
            if (s is null)
            {
                s = new TenantPaymentSettings { TenantId = tenantId };
                _context.TenantPaymentSettings.Add(s);
            }

            s.AcceptCash         = dto.AcceptCash;
            s.AcceptOnline       = dto.AcceptOnline;
            s.CcAvenueEnabled    = dto.CcAvenueEnabled;
            s.CcAvenueMerchantId = dto.CcAvenueMerchantId;
            s.CcAvenueAccessCode = dto.CcAvenueAccessCode;
            s.CcAvenueWorkingKey = dto.CcAvenueWorkingKey;
            s.MagnatiEnabled     = dto.MagnatiEnabled;
            s.MagnatiApiKey      = dto.MagnatiApiKey;
            s.MagnatiMerchantId  = dto.MagnatiMerchantId;
            s.MagnatiSecretKey   = dto.MagnatiSecretKey;

            await _context.SaveChangesAsync();
            return ApiResponse<PaymentSettingsDto>.Ok(MapPayment(s), "Payment settings updated.");
        }

        // ── Mapping helpers ───────────────────────────────────────────────────

        private static TenantResponse Map(Tenant t) => Fill(t, new TenantResponse());
        private static CreateTenantResponse MapCreate(Tenant t) => (CreateTenantResponse)Fill(t, new CreateTenantResponse());

        private static TenantResponse Fill(Tenant t, TenantResponse r)
        {
            r.Id                 = t.Id;
            r.Name               = t.Name;
            r.Slug               = t.Slug;
            r.LoginUrl           = t.LoginUrl;
            r.ContactEmail       = t.ContactEmail;
            r.ContactPhone       = t.ContactPhone;
            r.CompanyMobile      = t.CompanyMobile;
            r.Website            = t.Website;
            r.LogoUrl            = t.LogoUrl;
            r.TRN                = t.TRN;
            r.DefaultCountryId   = t.DefaultCountryId;
            r.DefaultCountryName = t.DefaultCountry?.Name;
            r.StateProvince      = t.StateProvince;
            r.DefaultCityText    = t.DefaultCityText;
            r.Street             = t.Street;
            r.PostalCode         = t.PostalCode;
            r.ContactTitle         = t.ContactTitle;
            r.ContactFirstName     = t.ContactFirstName;
            r.ContactLastName      = t.ContactLastName;
            r.ContactMobilePhone   = t.ContactMobilePhone;
            r.ContactPersonEmail   = t.ContactPersonEmail;
            r.ContactCountryId     = t.ContactCountryId;
            r.ContactCountryName = t.ContactCountry?.Name;
            r.ContactState       = t.ContactState;
            r.ContactCityText    = t.ContactCityText;
            r.ContactStreet      = t.ContactStreet;
            r.ContactPostalCode  = t.ContactPostalCode;
            r.IsActive           = t.IsActive;
            r.CreatedAt          = t.CreatedAt;
            return r;
        }

        private static PaymentSettingsDto MapPayment(TenantPaymentSettings s) => new()
        {
            AcceptCash         = s.AcceptCash,
            AcceptOnline       = s.AcceptOnline,
            CcAvenueEnabled    = s.CcAvenueEnabled,
            CcAvenueMerchantId = s.CcAvenueMerchantId,
            CcAvenueAccessCode = s.CcAvenueAccessCode,
            CcAvenueWorkingKey = s.CcAvenueWorkingKey,
            MagnatiEnabled     = s.MagnatiEnabled,
            MagnatiApiKey      = s.MagnatiApiKey,
            MagnatiMerchantId  = s.MagnatiMerchantId,
            MagnatiSecretKey   = s.MagnatiSecretKey
        };
    }
}
