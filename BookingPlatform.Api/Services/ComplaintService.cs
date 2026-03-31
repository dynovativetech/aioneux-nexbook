using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public class ComplaintService : IComplaintService
    {
        private readonly AppDbContext    _context;
        private readonly ITenantContext  _tenantContext;
        private readonly IWebHostEnvironment _env;

        public ComplaintService(AppDbContext context, ITenantContext tenantContext, IWebHostEnvironment env)
        {
            _context       = context;
            _tenantContext = tenantContext;
            _env           = env;
        }

        // ── Create ──────────────────────────────────────────────────────────

        public async Task<ApiResponse<ComplaintResponse>> CreateAsync(
            CreateComplaintRequest request, IFormFileCollection? images = null)
        {
            var errors = await ValidateCreateRequestAsync(request);
            if (errors.Count > 0)
                return ApiResponse<ComplaintResponse>.Fail("Validation failed.", errors);

            // If a categoryId is provided but doesn't exist in the DB, ignore it
            // (category name text is still stored — handles fallback client-side categories)
            int? resolvedCategoryId = null;
            if (request.CategoryId.HasValue && request.CategoryId.Value > 0)
            {
                var catExists = await _context.ComplaintCategories
                    .AnyAsync(c => c.Id == request.CategoryId.Value);
                resolvedCategoryId = catExists ? request.CategoryId : null;
            }

            var complaint = new Complaint
            {
                TenantId    = _tenantContext.TenantId ?? 1,
                BookingId   = request.BookingId,
                CategoryId  = resolvedCategoryId,
                Category    = request.Category?.Trim(),
                UserId      = request.UserId,
                Title       = request.Title.Trim(),
                Description = request.Description.Trim(),
                Status      = ComplaintStatus.Open,
                CreatedAt   = DateTime.UtcNow
            };

            _context.Complaints.Add(complaint);
            await _context.SaveChangesAsync();

            // Save uploaded images
            if (images != null && images.Count > 0)
            {
                var paths = await SaveImagesAsync("complaints", complaint.Id, images);
                if (paths.Count > 0)
                {
                    complaint.ImagePaths = string.Join(",", paths);
                    await _context.SaveChangesAsync();
                }
            }

            var created = await LoadComplaintAsync(complaint.Id);
            return ApiResponse<ComplaintResponse>.Ok(
                MapToResponse(created!), "Complaint submitted successfully.");
        }

        // ── Read ─────────────────────────────────────────────────────────────

        public async Task<ApiResponse<ComplaintResponse>> GetByIdAsync(int id)
        {
            var complaint = await LoadComplaintAsync(id);
            if (complaint is null)
                return ApiResponse<ComplaintResponse>.Fail($"Complaint with Id {id} was not found.", errorKind: ApiErrorKind.NotFound);

            return ApiResponse<ComplaintResponse>.Ok(MapToResponse(complaint));
        }

        public async Task<ApiResponse<List<ComplaintResponse>>> GetByUserAsync(int userId)
        {
            if (!await _context.Users.AnyAsync(u => u.Id == userId))
                return ApiResponse<List<ComplaintResponse>>.Fail(
                    $"User with Id {userId} does not exist.", errorKind: ApiErrorKind.NotFound);

            var complaints = await _context.Complaints
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .Include(c => c.User)
                .Include(c => c.Comments).ThenInclude(cc => cc.Author)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<ComplaintResponse>>.Ok(
                complaints.Select(MapToResponse).ToList());
        }

        public async Task<ApiResponse<List<ComplaintResponse>>> GetAllAsync(ComplaintFilterRequest? filter = null)
        {
            var query = _context.Complaints
                .AsNoTracking()
                .Include(c => c.User)
                .Include(c => c.Comments).ThenInclude(cc => cc.Author)
                .AsQueryable();

            if (filter != null)
            {
                if (filter.Status.HasValue)
                    query = query.Where(c => c.Status == filter.Status.Value);

                if (!string.IsNullOrWhiteSpace(filter.Category))
                    query = query.Where(c => c.Category != null &&
                        c.Category.ToLower() == filter.Category.ToLower().Trim());

                if (!string.IsNullOrWhiteSpace(filter.Search))
                {
                    var q = filter.Search.ToLower().Trim();
                    query = query.Where(c =>
                        c.Title.ToLower().Contains(q) ||
                        (c.User != null && c.User.FullName.ToLower().Contains(q)) ||
                        c.Id.ToString().Contains(q));
                }

                if (filter.DateFrom.HasValue)
                    query = query.Where(c => c.CreatedAt >= filter.DateFrom.Value.Date);

                if (filter.DateTo.HasValue)
                    query = query.Where(c => c.CreatedAt < filter.DateTo.Value.Date.AddDays(1));

                if (filter.UserId.HasValue)
                    query = query.Where(c => c.UserId == filter.UserId.Value);
            }

            var complaints = await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<ComplaintResponse>>.Ok(
                complaints.Select(MapToResponse).ToList());
        }

        // ── Admin: update status ─────────────────────────────────────────────

        public async Task<ApiResponse<ComplaintResponse>> UpdateStatusAsync(
            int id, UpdateComplaintStatusRequest request)
        {
            var complaint = await _context.Complaints.FindAsync(id);
            if (complaint is null)
                return ApiResponse<ComplaintResponse>.Fail(
                    $"Complaint with Id {id} was not found.", errorKind: ApiErrorKind.NotFound);

            var previousStatus = complaint.Status;
            complaint.Status    = request.Status;
            complaint.UpdatedAt = DateTime.UtcNow;

            // Append a system comment when an admin note is provided
            if (!string.IsNullOrWhiteSpace(request.AdminNote))
            {
                var attributedTo = request.AdminId ?? complaint.UserId;
                var systemComment = new ComplaintComment
                {
                    ComplaintId     = complaint.Id,
                    AuthorId        = attributedTo,
                    Text            = $"Status changed from {previousStatus} to {request.Status}. {request.AdminNote.Trim()}",
                    IsAdminComment  = true,
                    IsSystemComment = true,
                    CreatedAt       = DateTime.UtcNow
                };
                _context.ComplaintComments.Add(systemComment);
            }

            await _context.SaveChangesAsync();

            var updated = await LoadComplaintAsync(id);
            return ApiResponse<ComplaintResponse>.Ok(
                MapToResponse(updated!), $"Status updated to '{request.Status}'.");
        }

        // ── Add comment ──────────────────────────────────────────────────────

        public async Task<ApiResponse<CommentResponse>> AddCommentAsync(
            int complaintId, AddCommentRequest request, IFormFile? image = null)
        {
            var complaint = await _context.Complaints.FindAsync(complaintId);
            if (complaint is null)
                return ApiResponse<CommentResponse>.Fail(
                    $"Complaint with Id {complaintId} was not found.", errorKind: ApiErrorKind.NotFound);

            if (complaint.Status is ComplaintStatus.Resolved or ComplaintStatus.Rejected
                                 or ComplaintStatus.Closed or ComplaintStatus.Cancelled)
                return ApiResponse<CommentResponse>.Fail(
                    "Comments cannot be added to a closed complaint.");

            if (!await _context.Users.AnyAsync(u => u.Id == request.AuthorId))
                return ApiResponse<CommentResponse>.Fail(
                    $"User with Id {request.AuthorId} does not exist.", errorKind: ApiErrorKind.NotFound);

            string? imagePath = null;
            if (image != null)
            {
                var paths = await SaveImagesAsync("comments", complaintId, new FormFileCollection { image });
                imagePath = paths.FirstOrDefault();
            }

            var comment = new ComplaintComment
            {
                ComplaintId     = complaintId,
                AuthorId        = request.AuthorId,
                Text            = request.Text.Trim(),
                IsAdminComment  = request.IsAdminComment,
                IsSystemComment = false,
                ImagePath       = imagePath,
                CreatedAt       = DateTime.UtcNow
            };

            _context.ComplaintComments.Add(comment);

            // Auto-advance status: if admin replies and complaint is still Open, move to InProgress
            if (request.IsAdminComment && complaint.Status == ComplaintStatus.Open)
            {
                complaint.Status    = ComplaintStatus.InProgress;
                complaint.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await _context.Entry(comment).Reference(cc => cc.Author).LoadAsync();

            return ApiResponse<CommentResponse>.Ok(
                MapCommentToResponse(comment), "Comment added successfully.");
        }

        // ── Private helpers ──────────────────────────────────────────────────

        private async Task<Complaint?> LoadComplaintAsync(int id) =>
            await _context.Complaints
                .AsNoTracking()
                .Include(c => c.User)
                .Include(c => c.Comments).ThenInclude(cc => cc.Author)
                .FirstOrDefaultAsync(c => c.Id == id);

        private async Task<List<string>> ValidateCreateRequestAsync(CreateComplaintRequest request)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.Title))
                errors.Add("Title is required.");

            if (string.IsNullOrWhiteSpace(request.Description))
                errors.Add("Description is required.");

            if (!await _context.Users.AnyAsync(u => u.Id == request.UserId))
                errors.Add($"User with Id {request.UserId} does not exist.");

            // Only validate booking when one is provided
            if (request.BookingId.HasValue && request.BookingId.Value > 0)
            {
                if (!await _context.Bookings.AnyAsync(b => b.Id == request.BookingId.Value))
                    errors.Add($"Booking with Id {request.BookingId.Value} does not exist.");
            }

            return errors;
        }

        /// <summary>Saves uploaded images to wwwroot/uploads/{folder}/{parentId}/ and returns their relative URLs.</summary>
        private async Task<List<string>> SaveImagesAsync(
            string folder, int parentId, IFormFileCollection files)
        {
            var paths = new List<string>();

            var dir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", folder, parentId.ToString());
            Directory.CreateDirectory(dir);

            foreach (var file in files.Take(5))
            {
                if (file.Length == 0) continue;

                var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowed  = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                if (!allowed.Contains(ext)) continue;

                var filename = $"{Guid.NewGuid():N}{ext}";
                var fullPath = Path.Combine(dir, filename);

                using var stream = System.IO.File.Create(fullPath);
                await file.CopyToAsync(stream);

                paths.Add($"/uploads/{folder}/{parentId}/{filename}");
            }

            return paths;
        }

        private ComplaintResponse MapToResponse(Complaint c)
        {
            var imageUrls = string.IsNullOrWhiteSpace(c.ImagePaths)
                ? new List<string>()
                : c.ImagePaths.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();

            return new ComplaintResponse
            {
                Id          = c.Id,
                BookingId   = c.BookingId,
                CategoryId  = c.CategoryId,
                Category    = c.Category,
                UserId      = c.UserId,
                UserName    = c.User?.FullName ?? string.Empty,
                TenantId    = c.TenantId,
                Title       = c.Title,
                Description = c.Description,
                ImageUrls   = imageUrls,
                Status      = c.Status,
                CreatedAt   = c.CreatedAt,
                UpdatedAt   = c.UpdatedAt,
                Comments    = c.Comments
                               .OrderBy(cc => cc.CreatedAt)
                               .Select(MapCommentToResponse)
                               .ToList()
            };
        }

        private static CommentResponse MapCommentToResponse(ComplaintComment cc) => new()
        {
            Id              = cc.Id,
            AuthorId        = cc.AuthorId,
            AuthorName      = cc.Author?.FullName ?? string.Empty,
            Text            = cc.Text,
            IsAdminComment  = cc.IsAdminComment,
            IsSystemComment = cc.IsSystemComment,
            ImageUrl        = cc.ImagePath,
            CreatedAt       = cc.CreatedAt
        };
    }

    /// <summary>Helper to wrap a single IFormFile in a collection.</summary>
    internal sealed class FormFileCollection : List<IFormFile>, IFormFileCollection
    {
        public FormFileCollection() { }
        public FormFileCollection(IFormFile file) { Add(file); }
        public IFormFile? this[string name] => this.FirstOrDefault(f => f.Name == name);
        public IFormFile? GetFile(string name) => this[name];
        public IReadOnlyList<IFormFile> GetFiles(string name) => this.Where(f => f.Name == name).ToList();
    }
}
