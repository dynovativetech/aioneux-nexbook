namespace BookingPlatform.Api.DTOs
{
    public class AuthResponse
    {
        public bool   Success   { get; set; }
        public string Message   { get; set; } = string.Empty;

        public string  Token     { get; set; } = string.Empty;
        public int     UserId    { get; set; }
        public string  FullName  { get; set; } = string.Empty;
        public string  Email     { get; set; } = string.Empty;
        public string  Role      { get; set; } = string.Empty;
        public int?    TenantId  { get; set; }
        public DateTime ExpiresAt { get; set; }

        public List<string>? Errors { get; set; }

        public static AuthResponse Ok(string token, int userId, string fullName, string email, string role, int? tenantId, DateTime expiresAt) =>
            new() { Success = true, Message = "OK", Token = token, UserId = userId,
                    FullName = fullName, Email = email, Role = role, TenantId = tenantId, ExpiresAt = expiresAt };

        public static AuthResponse Fail(string message, List<string>? errors = null) =>
            new() { Success = false, Message = message, Errors = errors };
    }
}
