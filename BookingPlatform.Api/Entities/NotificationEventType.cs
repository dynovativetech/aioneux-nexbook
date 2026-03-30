namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Identifies the business event that triggered a notification.
    /// Used by TenantNotificationSettings to toggle per-event delivery,
    /// and by NotificationLog to record what was sent.
    /// </summary>
    public enum NotificationEventType
    {
        BookingCreated          = 0,
        BookingConfirmed        = 1,
        BookingRejected         = 2,
        BookingCancelled        = 3,
        BookingRescheduled      = 4,
        ComplaintCreated        = 5,
        ComplaintStatusChanged  = 6,
        WelcomeOrganizer        = 7,
        WelcomeCustomer         = 8,
    }
}
