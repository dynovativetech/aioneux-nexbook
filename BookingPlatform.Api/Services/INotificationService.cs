namespace BookingPlatform.Api.Services
{
    /// <summary>
    /// High-level notification service.
    /// Each method dispatches emails to the appropriate recipients based on
    /// TenantNotificationSettings and logs every attempt to NotificationLog.
    /// All methods are non-blocking for callers — failures are logged, not rethrown.
    /// </summary>
    public interface INotificationService
    {
        Task NotifyBookingCreatedAsync(int bookingId);
        Task NotifyBookingConfirmedAsync(int bookingId);
        Task NotifyBookingRejectedAsync(int bookingId, string reason);
        Task NotifyBookingCancelledAsync(int bookingId);
        Task NotifyComplaintCreatedAsync(int complaintId);
        Task NotifyComplaintStatusChangedAsync(int complaintId);
        Task NotifyWelcomeCustomerAsync(int userId);
        Task NotifyWelcomeOrganizerAsync(int userId, int venueId, string tempPassword);
    }
}
