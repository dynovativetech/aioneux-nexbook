using BookingPlatform.Api.DTOs;
using Microsoft.AspNetCore.Http;

namespace BookingPlatform.Api.Services
{
    public interface IDocumentService
    {
        // ── Document types (SA managed) ──────────────────────────────────────
        Task<ApiResponse<List<TenantDocumentTypeResponse>>> GetDocumentTypesAsync();
        Task<ApiResponse<TenantDocumentTypeResponse>>       CreateDocumentTypeAsync(CreateDocumentTypeRequest request);
        Task<ApiResponse<TenantDocumentTypeResponse>>       UpdateDocumentTypeAsync(int id, CreateDocumentTypeRequest request);
        Task<ApiResponse<bool>>                             DeleteDocumentTypeAsync(int id);

        // ── Tenant documents ─────────────────────────────────────────────────
        Task<ApiResponse<List<TenantDocumentResponse>>>     GetTenantDocumentsAsync(int tenantId);
        Task<ApiResponse<TenantDocumentResponse>>           UploadDocumentAsync(int tenantId, int documentTypeId, IFormFile file, string? notes);
        Task<ApiResponse<bool>>                             DeleteDocumentAsync(int tenantId, int documentId);
    }
}
