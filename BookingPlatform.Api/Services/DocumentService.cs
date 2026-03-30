using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BookingPlatform.Api.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly string[] _allowedExtensions;
        private readonly string[] _allowedMimeTypes;
        private readonly long _maxFileSizeBytes;

        public DocumentService(AppDbContext context, IWebHostEnvironment env, IConfiguration config)
        {
            _context = context;
            _env     = env;

            var section = config.GetSection("Upload");
            _allowedExtensions = section.GetSection("AllowedExtensions").Get<string[]>()
                                 ?? [".png", ".jpg", ".jpeg", ".pdf"];
            _allowedMimeTypes  = section.GetSection("AllowedMimeTypes").Get<string[]>()
                                 ?? ["image/png", "image/jpeg", "application/pdf"];
            _maxFileSizeBytes  = (section.GetValue<int?>("MaxFileSizeMb") ?? 10) * 1024L * 1024L;
        }

        // ── Document types ────────────────────────────────────────────────────

        public async Task<ApiResponse<List<TenantDocumentTypeResponse>>> GetDocumentTypesAsync()
        {
            var types = await _context.TenantDocumentTypes
                .AsNoTracking()
                .Where(t => t.IsActive)
                .OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
                .ToListAsync();

            return ApiResponse<List<TenantDocumentTypeResponse>>.Ok(types.Select(MapType).ToList());
        }

        public async Task<ApiResponse<TenantDocumentTypeResponse>> CreateDocumentTypeAsync(CreateDocumentTypeRequest request)
        {
            var dt = new TenantDocumentType
            {
                Name        = request.Name.Trim(),
                Description = request.Description?.Trim(),
                IsRequired  = request.IsRequired,
                SortOrder   = request.SortOrder,
                IsActive    = true,
                CreatedAt   = DateTime.UtcNow
            };
            _context.TenantDocumentTypes.Add(dt);
            await _context.SaveChangesAsync();
            return ApiResponse<TenantDocumentTypeResponse>.Ok(MapType(dt), "Document type created.");
        }

        public async Task<ApiResponse<TenantDocumentTypeResponse>> UpdateDocumentTypeAsync(int id, CreateDocumentTypeRequest request)
        {
            var dt = await _context.TenantDocumentTypes.FindAsync(id);
            if (dt is null) return ApiResponse<TenantDocumentTypeResponse>.Fail("Not found.");
            dt.Name        = request.Name.Trim();
            dt.Description = request.Description?.Trim();
            dt.IsRequired  = request.IsRequired;
            dt.SortOrder   = request.SortOrder;
            await _context.SaveChangesAsync();
            return ApiResponse<TenantDocumentTypeResponse>.Ok(MapType(dt), "Updated.");
        }

        public async Task<ApiResponse<bool>> DeleteDocumentTypeAsync(int id)
        {
            var dt = await _context.TenantDocumentTypes.FindAsync(id);
            if (dt is null) return ApiResponse<bool>.Fail("Not found.");
            dt.IsActive = false; // soft delete
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.Ok(true, "Deleted.");
        }

        // ── Tenant documents ──────────────────────────────────────────────────

        public async Task<ApiResponse<List<TenantDocumentResponse>>> GetTenantDocumentsAsync(int tenantId)
        {
            var docs = await _context.TenantDocuments
                .AsNoTracking()
                .Include(d => d.DocumentType)
                .Where(d => d.TenantId == tenantId)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();

            return ApiResponse<List<TenantDocumentResponse>>.Ok(docs.Select(MapDoc).ToList());
        }

        public async Task<ApiResponse<TenantDocumentResponse>> UploadDocumentAsync(
            int tenantId, int documentTypeId, IFormFile file, string? notes)
        {
            // ── File-type validation ──────────────────────────────────────────────
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(ext))
                return ApiResponse<TenantDocumentResponse>.Fail(
                    $"File type '{ext}' is not allowed. Accepted formats: {string.Join(", ", _allowedExtensions)}.");

            if (!_allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
                return ApiResponse<TenantDocumentResponse>.Fail(
                    $"Content type '{file.ContentType}' is not allowed.");

            if (file.Length > _maxFileSizeBytes)
                return ApiResponse<TenantDocumentResponse>.Fail(
                    $"File exceeds the maximum allowed size of {_maxFileSizeBytes / 1024 / 1024} MB.");

            // ── Persist file ──────────────────────────────────────────────────────
            var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "tenants", tenantId.ToString());
            Directory.CreateDirectory(uploadsDir);

            var storedName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath   = Path.Combine(uploadsDir, storedName);

            await using var stream = File.Create(filePath);
            await file.CopyToAsync(stream);

            var doc = new TenantDocument
            {
                TenantId         = tenantId,
                DocumentTypeId   = documentTypeId,
                OriginalFileName = file.FileName,
                StoredFileName   = storedName,
                FilePath         = filePath,
                ContentType      = file.ContentType,
                FileSizeBytes    = file.Length,
                Notes            = notes?.Trim(),
                UploadedAt       = DateTime.UtcNow
            };
            _context.TenantDocuments.Add(doc);
            await _context.SaveChangesAsync();

            await _context.Entry(doc).Reference(d => d.DocumentType).LoadAsync();
            return ApiResponse<TenantDocumentResponse>.Ok(MapDoc(doc), "Document uploaded.");
        }

        public async Task<ApiResponse<bool>> DeleteDocumentAsync(int tenantId, int documentId)
        {
            var doc = await _context.TenantDocuments
                .FirstOrDefaultAsync(d => d.Id == documentId && d.TenantId == tenantId);
            if (doc is null) return ApiResponse<bool>.Fail("Document not found.");

            if (File.Exists(doc.FilePath)) File.Delete(doc.FilePath);
            _context.TenantDocuments.Remove(doc);
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.Ok(true, "Document deleted.");
        }

        // ── Mapping ───────────────────────────────────────────────────────────

        private static TenantDocumentTypeResponse MapType(TenantDocumentType t) => new()
        {
            Id          = t.Id,
            Name        = t.Name,
            Description = t.Description,
            IsRequired  = t.IsRequired,
            SortOrder   = t.SortOrder,
            IsActive    = t.IsActive
        };

        private static TenantDocumentResponse MapDoc(TenantDocument d) => new()
        {
            Id               = d.Id,
            DocumentTypeId   = d.DocumentTypeId,
            DocumentTypeName = d.DocumentType?.Name ?? string.Empty,
            OriginalFileName = d.OriginalFileName,
            FileSizeBytes    = d.FileSizeBytes,
            Notes            = d.Notes,
            UploadedAt       = d.UploadedAt,
            DownloadUrl      = $"/uploads/tenants/{d.TenantId}/{d.StoredFileName}"
        };
    }
}
