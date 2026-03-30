using BookingPlatform.Api.DTOs;

namespace BookingPlatform.Api.Services
{
    public interface ITenantService
    {
        Task<ApiResponse<List<TenantResponse>>>    GetAllAsync();
        Task<ApiResponse<TenantResponse>>          GetByIdAsync(int id);
        Task<ApiResponse<CreateTenantResponse>>    CreateAsync(CreateTenantRequest request);
        Task<ApiResponse<TenantResponse>>          UpdateAsync(int id, UpdateTenantRequest request);
        Task<ApiResponse<TenantResponse>>          ToggleActiveAsync(int id);
        Task<ApiResponse<PaymentSettingsDto>>      GetPaymentSettingsAsync(int tenantId);
        Task<ApiResponse<PaymentSettingsDto>>      UpdatePaymentSettingsAsync(int tenantId, PaymentSettingsDto dto);
    }
}
