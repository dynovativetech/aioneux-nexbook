using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// Request payload for POST /api/bookings/group.
    ///
    /// Key corrections vs. the previous version
    /// ──────────────────────────────────────────
    /// • Removed the `new int ParticipantCount` property shadow.
    ///   Using `new` to hide a base-class property causes a well-known C# pitfall:
    ///   casting to the base type yields the base default (1), not the derived
    ///   default (2), making validation inconsistent across call-sites.
    ///   The [MinGroupSize] constant + service-layer check is the single source of truth.
    ///
    /// • Added [MinLength(1)] on Participants to reject an empty list at the
    ///   model-binding stage rather than inside the service.
    ///
    /// • Added [Required] on Participants — a group booking without names is
    ///   nonsensical and should fail fast before hitting the DB.
    /// </summary>
    public class CreateGroupBookingRequest : CreateBookingRequest
    {
        // ── ParticipantCount is inherited from CreateBookingRequest ([Range(1, 10_000)]).
        // ── The service enforces >= 2 for group bookings.
        // ── No property shadow needed here.

        /// <summary>
        /// Named list of attendees. Required for group bookings.
        /// The service derives ParticipantCount from this list if the caller omits it.
        /// </summary>
        [Required(ErrorMessage = "Participants list is required for group bookings.")]
        [MinLength(2, ErrorMessage = "A group booking requires at least 2 participants.")]
        public new List<BookingParticipantDto> Participants { get; set; } = [];
    }
}
