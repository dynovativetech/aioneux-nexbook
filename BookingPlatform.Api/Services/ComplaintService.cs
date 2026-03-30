using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public class ComplaintService : IComplaintService
    {
        private readonly AppDbContext   _context;
        private readonly ITenantContext _tenantContext;

        public ComplaintService(AppDbContext context, ITenantContext tenantContext)
        {
            _context       = context;
            _tenantContext = tenantContext;
        }

        // ── Create ──────────────────────────────────────────────────────────

        public async Task<ApiResponse<ComplaintResponse>> CreateAsync(CreateComplaintRequest request)
        {
            var errors = await ValidateCreateRequestAsync(request);
            if (errors.Count > 0)
                return ApiResponse<ComplaintResponse>.Fail("Validation failed.", errors);

            var complaint = new Complaint
            {
                TenantId    = _tenantContext.TenantId ?? 1,
                BookingId   = request.BookingId,
                UserId      = request.UserId,
                Title       = request.Title.Trim(),
                Description = request.Description.Trim(),
                Status      = ComplaintStatus.Open,
                CreatedAt   = DateTime.UtcNow
            };

            _context.Complaints.Add(complaint);
            await _context.SaveChangesAsync();

            var created = await LoadComplaintAsync(complaint.Id);
            return ApiResponse<ComplaintResponse>.Ok(
                MapToResponse(created!), "Complaint submitted successfully.");
        }

        // ── Read ─────────────────────────────────────────────────────────────

        public async Task<ApiResponse<ComplaintResponse>> GetByIdAsync(int id)
        {
            var complaint = await LoadComplaintAsync(id);
            if (complaint is null)
                return ApiResponse<ComplaintResponse>.Fail($"Complaint with Id {id} was not found.");

            return ApiResponse<ComplaintResponse>.Ok(MapToResponse(complaint));
        }

        public async Task<ApiResponse<List<ComplaintResponse>>> GetByUserAsync(int userId)
        {
            if (!await _context.Users.AnyAsync(u => u.Id == userId))
                return ApiResponse<List<ComplaintResponse>>.Fail(
                    $"User with Id {userId} does not exist.");

            var complaints = await _context.Complaints
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .Include(c => c.User)
                .Include(c => c.Comments)
                    .ThenInclude(cc => cc.Author)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<ComplaintResponse>>.Ok(
                complaints.Select(MapToResponse).ToList());
        }

        public async Task<ApiResponse<List<ComplaintResponse>>> GetAllAsync()
        {
            var complaints = await _context.Complaints
                .AsNoTracking()
                .Include(c => c.User)
                .Include(c => c.Comments)
                    .ThenInclude(cc => cc.Author)
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
                    $"Complaint with Id {id} was not found.");

            if (complaint.Status == request.Status)
                return ApiResponse<ComplaintResponse>.Fail(
                    $"Complaint is already in '{request.Status}' status.");

            var previousStatus = complaint.Status;
            complaint.Status = request.Status;

            // Append an automated system comment when an admin note is provided
            if (!string.IsNullOrWhiteSpace(request.AdminNote))
            {
                var systemComment = new ComplaintComment
                {
                    ComplaintId = complaint.Id,
                    AuthorId    = complaint.UserId,   // attributed to the user's record; swap for admin ID when auth is added
                    Text        = $"[Status changed: {previousStatus} → {request.Status}] {request.AdminNote.Trim()}",
                    CreatedAt   = DateTime.UtcNow
                };
                _context.ComplaintComments.Add(systemComment);
            }

            await _context.SaveChangesAsync();

            var updated = await LoadComplaintAsync(id);
            return ApiResponse<ComplaintResponse>.Ok(
                MapToResponse(updated!), $"Complaint status updated to '{request.Status}'.");
        }

        // ── Add comment ──────────────────────────────────────────────────────

        public async Task<ApiResponse<CommentResponse>> AddCommentAsync(
            int complaintId, AddCommentRequest request)
        {
            var complaint = await _context.Complaints.FindAsync(complaintId);
            if (complaint is null)
                return ApiResponse<CommentResponse>.Fail(
                    $"Complaint with Id {complaintId} was not found.");

            if (complaint.Status is ComplaintStatus.Resolved or ComplaintStatus.Rejected)
                return ApiResponse<CommentResponse>.Fail(
                    "Comments cannot be added to a resolved or rejected complaint.");

            if (!await _context.Users.AnyAsync(u => u.Id == request.AuthorId))
                return ApiResponse<CommentResponse>.Fail(
                    $"User with Id {request.AuthorId} does not exist.");

            var comment = new ComplaintComment
            {
                ComplaintId = complaintId,
                AuthorId    = request.AuthorId,
                Text        = request.Text.Trim(),
                CreatedAt   = DateTime.UtcNow
            };

            _context.ComplaintComments.Add(comment);
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
                .Include(c => c.Comments)
                    .ThenInclude(cc => cc.Author)
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

            if (!await _context.Bookings.AnyAsync(b => b.Id == request.BookingId))
                errors.Add($"Booking with Id {request.BookingId} does not exist.");

            // A user can only raise one open/in-progress complaint per booking
            if (errors.Count == 0)
            {
                var duplicate = await _context.Complaints.AnyAsync(c =>
                    c.BookingId == request.BookingId &&
                    c.UserId    == request.UserId &&
                    c.Status != ComplaintStatus.Resolved &&
                    c.Status != ComplaintStatus.Rejected);

                if (duplicate)
                    errors.Add("An active complaint already exists for this booking.");
            }

            return errors;
        }

        private static ComplaintResponse MapToResponse(Complaint c) => new()
        {
            Id          = c.Id,
            BookingId   = c.BookingId,
            UserId      = c.UserId,
            UserName    = c.User?.FullName ?? string.Empty,
            Title       = c.Title,
            Description = c.Description,
            Status      = c.Status,
            CreatedAt   = c.CreatedAt,
            Comments    = c.Comments
                           .OrderBy(cc => cc.CreatedAt)
                           .Select(MapCommentToResponse)
                           .ToList()
        };

        private static CommentResponse MapCommentToResponse(ComplaintComment cc) => new()
        {
            Id         = cc.Id,
            AuthorId   = cc.AuthorId,
            AuthorName = cc.Author?.FullName ?? string.Empty,
            Text       = cc.Text,
            CreatedAt  = cc.CreatedAt
        };
    }
}
