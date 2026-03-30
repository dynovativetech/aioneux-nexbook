namespace BookingPlatform.Api.Services
{
    public interface IAuditService
    {
        /// <summary>
        /// Record a single audit event.  The actor's identity is resolved automatically
        /// from the current HTTP context JWT claims.
        /// </summary>
        /// <param name="action">Verb: Create | Update | Delete | Login | Register | Cancel …</param>
        /// <param name="entityType">Domain type: Booking | Facility | Activity | Instructor | Complaint | User</param>
        /// <param name="entityId">PK of the affected row (optional).</param>
        /// <param name="entityName">Human-readable label for quick display.</param>
        /// <param name="details">Sentence explaining what changed.</param>
        Task LogAsync(
            string  action,
            string  entityType,
            int?    entityId   = null,
            string? entityName = null,
            string? details    = null);
    }
}
