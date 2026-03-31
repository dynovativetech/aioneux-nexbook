namespace BookingPlatform.Api.DTOs
{
    public class CommentResponse
    {
        public int      Id              { get; set; }
        public int      AuthorId        { get; set; }
        public string   AuthorName      { get; set; } = string.Empty;
        public string   Text            { get; set; } = string.Empty;
        public bool     IsAdminComment  { get; set; }
        public bool     IsSystemComment { get; set; }
        public string?  ImageUrl        { get; set; }
        public DateTime CreatedAt       { get; set; }
    }
}
