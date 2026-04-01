namespace BookingPlatform.Api.Entities
{
    public class EventImage
    {
        public int Id { get; set; }

        public int   EventId { get; set; }
        public Event? Event  { get; set; }

        public int  SortOrder { get; set; } = 0;
        public bool IsPrimary { get; set; } = false;

        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public string Url => $"/uploads/events/{EventId}/{FileName}";
    }
}

