using BookingPlatform.Api.DTOs;

namespace BookingPlatform.Api.Services
{
    public interface ILocationService
    {
        // ── Read ─────────────────────────────────────────────────────────────
        Task<ApiResponse<List<CountryResponse>>>   GetCountriesAsync();
        Task<ApiResponse<List<CityResponse>>>      GetCitiesAsync(int countryId);
        Task<ApiResponse<List<AreaResponse>>>      GetAreasAsync(int cityId);
        /// <summary>When areaId is null, returns all communities for the current tenant.</summary>
        Task<ApiResponse<List<CommunityResponse>>> GetCommunitiesAsync(int? areaId = null);
        Task<ApiResponse<List<VenueResponse>>>     GetVenuesAsync(int communityId);

        // ── Create ───────────────────────────────────────────────────────────
        Task<ApiResponse<CountryResponse>>   CreateCountryAsync(CreateCountryRequest request);
        Task<ApiResponse<CityResponse>>      CreateCityAsync(CreateCityRequest request);
        Task<ApiResponse<AreaResponse>>      CreateAreaAsync(CreateAreaRequest request);
        Task<ApiResponse<CommunityResponse>> CreateCommunityAsync(CreateCommunityRequest request);
        Task<ApiResponse<VenueResponse>>     CreateVenueAsync(CreateVenueRequest request);

        // ── Update / Delete ───────────────────────────────────────────────────
        Task<ApiResponse<CommunityResponse>> UpdateCommunityAsync(int id, CreateCommunityRequest request);
        Task<ApiResponse<bool>>              DeleteCommunityAsync(int id);
    }
}
