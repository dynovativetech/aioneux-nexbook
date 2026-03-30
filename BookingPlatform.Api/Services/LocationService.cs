using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public class LocationService : ILocationService
    {
        private readonly AppDbContext  _context;
        private readonly ITenantContext _tenantContext;

        public LocationService(AppDbContext context, ITenantContext tenantContext)
        {
            _context       = context;
            _tenantContext = tenantContext;
        }

        // ── Countries ─────────────────────────────────────────────────────────

        public async Task<ApiResponse<List<CountryResponse>>> GetCountriesAsync()
        {
            var items = await _context.Countries
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .ToListAsync();

            return ApiResponse<List<CountryResponse>>.Ok(items.Select(MapCountry).ToList());
        }

        public async Task<ApiResponse<CountryResponse>> CreateCountryAsync(CreateCountryRequest request)
        {
            if (await _context.Countries.AnyAsync(c => c.Code == request.Code.ToUpper()))
                return ApiResponse<CountryResponse>.Fail($"Country code '{request.Code}' already exists.");

            var entity = new Country { Name = request.Name.Trim(), Code = request.Code.Trim().ToUpper() };
            _context.Countries.Add(entity);
            await _context.SaveChangesAsync();
            return ApiResponse<CountryResponse>.Ok(MapCountry(entity), "Country created.");
        }

        // ── Cities ────────────────────────────────────────────────────────────

        public async Task<ApiResponse<List<CityResponse>>> GetCitiesAsync(int countryId)
        {
            var items = await _context.Cities
                .Include(c => c.Country)
                .AsNoTracking()
                .Where(c => c.CountryId == countryId)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return ApiResponse<List<CityResponse>>.Ok(items.Select(MapCity).ToList());
        }

        public async Task<ApiResponse<CityResponse>> CreateCityAsync(CreateCityRequest request)
        {
            if (!await _context.Countries.AnyAsync(c => c.Id == request.CountryId))
                return ApiResponse<CityResponse>.Fail("Country not found.", errorKind: ApiErrorKind.NotFound);

            var entity = new City { CountryId = request.CountryId, Name = request.Name.Trim() };
            _context.Cities.Add(entity);
            await _context.SaveChangesAsync();

            await _context.Entry(entity).Reference(c => c.Country).LoadAsync();
            return ApiResponse<CityResponse>.Ok(MapCity(entity), "City created.");
        }

        // ── Areas ─────────────────────────────────────────────────────────────

        public async Task<ApiResponse<List<AreaResponse>>> GetAreasAsync(int cityId)
        {
            var items = await _context.Areas
                .Include(a => a.City)
                .AsNoTracking()
                .Where(a => a.CityId == cityId)
                .OrderBy(a => a.Name)
                .ToListAsync();

            return ApiResponse<List<AreaResponse>>.Ok(items.Select(MapArea).ToList());
        }

        public async Task<ApiResponse<AreaResponse>> CreateAreaAsync(CreateAreaRequest request)
        {
            if (!await _context.Cities.AnyAsync(c => c.Id == request.CityId))
                return ApiResponse<AreaResponse>.Fail("City not found.", errorKind: ApiErrorKind.NotFound);

            if (_tenantContext.TenantId is null)
                return ApiResponse<AreaResponse>.Fail("Tenant context is required.");

            var entity = new Area
            {
                CityId   = request.CityId,
                TenantId = _tenantContext.TenantId.Value,
                Name     = request.Name.Trim()
            };
            _context.Areas.Add(entity);
            await _context.SaveChangesAsync();

            await _context.Entry(entity).Reference(a => a.City).LoadAsync();
            return ApiResponse<AreaResponse>.Ok(MapArea(entity), "Area created.");
        }

        // ── Communities ───────────────────────────────────────────────────────

        public async Task<ApiResponse<List<CommunityResponse>>> GetCommunitiesAsync(int? areaId = null)
        {
            var query = _context.Communities
                .Include(c => c.Area)
                .AsNoTracking()
                .AsQueryable();

            if (areaId.HasValue && areaId.Value > 0)
                query = query.Where(c => c.AreaId == areaId.Value);

            var items = await query.OrderBy(c => c.Name).ToListAsync();
            return ApiResponse<List<CommunityResponse>>.Ok(items.Select(MapCommunity).ToList());
        }

        public async Task<ApiResponse<CommunityResponse>> CreateCommunityAsync(CreateCommunityRequest request)
        {
            if (!await _context.Areas.AnyAsync(a => a.Id == request.AreaId))
                return ApiResponse<CommunityResponse>.Fail("Area not found.", errorKind: ApiErrorKind.NotFound);

            if (_tenantContext.TenantId is null)
                return ApiResponse<CommunityResponse>.Fail("Tenant context is required.");

            var entity = new Community
            {
                AreaId      = request.AreaId,
                TenantId    = _tenantContext.TenantId.Value,
                Name        = request.Name.Trim(),
                Description = request.Description
            };
            _context.Communities.Add(entity);
            await _context.SaveChangesAsync();

            await _context.Entry(entity).Reference(c => c.Area).LoadAsync();
            return ApiResponse<CommunityResponse>.Ok(MapCommunity(entity), "Community created.");
        }

        public async Task<ApiResponse<CommunityResponse>> UpdateCommunityAsync(int id, CreateCommunityRequest request)
        {
            var entity = await _context.Communities.Include(c => c.Area).FirstOrDefaultAsync(c => c.Id == id);
            if (entity is null)
                return ApiResponse<CommunityResponse>.NotFound("Community not found.");

            entity.Name        = request.Name.Trim();
            entity.Description = request.Description;
            await _context.SaveChangesAsync();

            return ApiResponse<CommunityResponse>.Ok(MapCommunity(entity), "Community updated.");
        }

        public async Task<ApiResponse<bool>> DeleteCommunityAsync(int id)
        {
            var entity = await _context.Communities.FindAsync(id);
            if (entity is null)
                return ApiResponse<bool>.NotFound("Community not found.");

            _context.Communities.Remove(entity);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.Ok(true, "Community deleted.");
        }

        // ── Venues ────────────────────────────────────────────────────────────

        public async Task<ApiResponse<List<VenueResponse>>> GetVenuesAsync(int communityId)
        {
            var items = await _context.Venues
                .Include(v => v.Community)
                .AsNoTracking()
                .Where(v => v.CommunityId == communityId)
                .OrderBy(v => v.Name)
                .ToListAsync();

            return ApiResponse<List<VenueResponse>>.Ok(items.Select(MapVenue).ToList());
        }

        public async Task<ApiResponse<VenueResponse>> CreateVenueAsync(CreateVenueRequest request)
        {
            if (!await _context.Communities.AnyAsync(c => c.Id == request.CommunityId))
                return ApiResponse<VenueResponse>.Fail("Community not found.", errorKind: ApiErrorKind.NotFound);

            if (_tenantContext.TenantId is null)
                return ApiResponse<VenueResponse>.Fail("Tenant context is required.");

            var entity = new Venue
            {
                CommunityId  = request.CommunityId,
                TenantId     = _tenantContext.TenantId.Value,
                Name         = request.Name.Trim(),
                Address      = request.Address.Trim(),
                Latitude     = request.Latitude,
                Longitude    = request.Longitude,
                IsActive     = true
            };
            _context.Venues.Add(entity);
            await _context.SaveChangesAsync();

            await _context.Entry(entity).Reference(v => v.Community).LoadAsync();
            return ApiResponse<VenueResponse>.Ok(MapVenue(entity), "Venue created.");
        }

        // ── Mappers ───────────────────────────────────────────────────────────

        private static CountryResponse MapCountry(Country c) =>
            new() { Id = c.Id, Name = c.Name, Code = c.Code };

        private static CityResponse MapCity(City c) =>
            new() { Id = c.Id, CountryId = c.CountryId, CountryName = c.Country?.Name ?? "", Name = c.Name };

        private static AreaResponse MapArea(Area a) =>
            new() { Id = a.Id, CityId = a.CityId, CityName = a.City?.Name ?? "", TenantId = a.TenantId, Name = a.Name };

        private static CommunityResponse MapCommunity(Community c) =>
            new() { Id = c.Id, AreaId = c.AreaId, AreaName = c.Area?.Name ?? "", TenantId = c.TenantId, Name = c.Name, Description = c.Description };

        private static VenueResponse MapVenue(Venue v) =>
            new() { Id = v.Id, CommunityId = v.CommunityId, CommunityName = v.Community?.Name ?? "",
                    TenantId = v.TenantId, Name = v.Name, Address = v.Address,
                    Latitude = v.Latitude, Longitude = v.Longitude,
                    IsActive = v.IsActive };
    }
}
