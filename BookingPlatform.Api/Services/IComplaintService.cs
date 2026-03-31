using BookingPlatform.Api.DTOs;

namespace BookingPlatform.Api.Services
{
    public interface IComplaintService
    {
        Task<ApiResponse<ComplaintResponse>>       CreateAsync(CreateComplaintRequest request, IFormFileCollection? images = null);
        Task<ApiResponse<ComplaintResponse>>       GetByIdAsync(int id);
        Task<ApiResponse<List<ComplaintResponse>>> GetByUserAsync(int userId);
        Task<ApiResponse<List<ComplaintResponse>>> GetAllAsync(ComplaintFilterRequest? filter = null);
        Task<ApiResponse<ComplaintResponse>>       UpdateStatusAsync(int id, UpdateComplaintStatusRequest request);
        Task<ApiResponse<CommentResponse>>         AddCommentAsync(int complaintId, AddCommentRequest request, IFormFile? image = null);
    }
}
