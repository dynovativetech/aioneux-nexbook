namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Lifecycle status for an individual FacilityReservation or InstructorReservation.
    /// Kept separate from BookingStatus so that resource locks can be managed
    /// independently of the overall booking state.
    ///
    /// Why separate tables?
    ///   Facility and instructor are different resources with different business rules:
    ///   - A facility may have a capacity constraint or maintenance window.
    ///   - An instructor must be qualified for the chosen activity.
    ///   Keeping reservations in separate tables lets us validate, lock, and release
    ///   each resource atomically, even when a booking spans multiple slots.
    /// </summary>
    public enum ReservationStatus
    {
        Pending,
        Confirmed,
        Cancelled,
        Completed,
    }
}
