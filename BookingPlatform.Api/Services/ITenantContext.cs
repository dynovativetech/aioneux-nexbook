namespace BookingPlatform.Api.Services
{
    public interface ITenantContext
    {
        int?   TenantId    { get; }
        int    UserId      { get; }
        string Role        { get; }
        bool   IsSuperAdmin { get; }
    }
}
