namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Many-to-many junction: which Activities can be performed in which Facility.
    ///
    /// A single large hall may support multiple activities (Badminton, Basketball, Football).
    /// When a customer books a facility they select one activity from this list.
    /// Composite PK: (FacilityId, ActivityId).
    /// </summary>
    public class FacilityActivity
    {
        public int       FacilityId { get; set; }
        public Facility? Facility   { get; set; }

        public int       ActivityId { get; set; }
        public Activity? Activity   { get; set; }
    }
}
