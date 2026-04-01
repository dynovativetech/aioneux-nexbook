namespace BookingPlatform.Api.Entities
{
    public class EventRsvp
    {
        public int Id { get; set; }

        public int   EventId { get; set; }
        public Event? Event  { get; set; }

        public int   UserId { get; set; }
        public User? User   { get; set; }

        public EventRsvpStatus Status { get; set; } = EventRsvpStatus.Going;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

