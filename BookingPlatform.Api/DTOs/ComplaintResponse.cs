using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    public class ComplaintResponse
    {
        public int    Id          { get; set; }

        public int    BookingId   { get; set; }
        public int    UserId      { get; set; }
        public string UserName    { get; set; } = string.Empty;

        public string Title       { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ComplaintStatus Status    { get; set; }
        public DateTime        CreatedAt { get; set; }

        public List<CommentResponse> Comments { get; set; } = new();
    }
}
