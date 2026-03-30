namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Records whether a non-bookable supporting feature (amenity) is available at a Venue.
    /// Amenities are purely informational — they affect discoverability/search but are not bookable.
    /// Examples: Parking, AC, Male/Female Washrooms, Disabled Access, Wi-Fi.
    /// </summary>
    public class VenueAmenity
    {
        public int              Id          { get; set; }
        public int              VenueId     { get; set; }
        public Venue?           Venue       { get; set; }

        public VenueAmenityType AmenityType { get; set; }

        /// <summary>True if this amenity is currently available at the venue.</summary>
        public bool             IsAvailable { get; set; } = true;

        /// <summary>Optional extra detail, e.g. "2 floors of paid parking".</summary>
        public string?          Notes       { get; set; }
    }
}
