namespace BookingPlatform.Api.DTOs
{
    public class InviteOrganizerRequest
    {
        public string  Email    { get; set; } = string.Empty;
        public string? FullName { get; set; }
    }

    public class InviteOrganizerResponse
    {
        public int    UserId       { get; set; }
        public string Email        { get; set; } = string.Empty;
        public string FullName     { get; set; } = string.Empty;
        public string TempPassword { get; set; } = string.Empty;
    }
}
