namespace BookingPlatform.Api.DTOs
{
    public class CommentResponse
    {
        public int      Id         { get; set; }
        public int      AuthorId   { get; set; }
        public string   AuthorName { get; set; } = string.Empty;
        public string   Text       { get; set; } = string.Empty;
        public DateTime CreatedAt  { get; set; }
    }
}
