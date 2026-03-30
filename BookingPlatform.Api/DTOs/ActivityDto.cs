namespace BookingPlatform.Api.DTOs
{
    public class CreateActivityRequest
    {
        public string  Name            { get; set; } = string.Empty;
        public int     DurationMinutes { get; set; }
        public string? Description     { get; set; }
        public string? Category        { get; set; }
        public int     BufferMinutes   { get; set; }
        public decimal Price           { get; set; }
    }

    public class ActivityResponse
    {
        public int     Id              { get; set; }
        public string  Name            { get; set; } = string.Empty;
        public int     DurationMinutes { get; set; }
        public int     TenantId        { get; set; }
        public string? Description     { get; set; }
        public string? Category        { get; set; }
        public int     BufferMinutes   { get; set; }
        public decimal Price           { get; set; }
        public bool    IsActive        { get; set; }
    }
}
