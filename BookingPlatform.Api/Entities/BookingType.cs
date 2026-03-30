namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Discriminates how a booking was created and how it should be treated.
    /// Single  – one person, one time slot.
    /// Group   – multiple participants sharing one time slot.
    /// MultiSlot – one booking covers several non-contiguous time slots
    ///             (e.g. 10:00-11:00 and 17:00-18:00 on the same or different dates).
    ///             Each slot is stored as a separate FacilityReservation / InstructorReservation
    ///             child record, all owned by this single parent Booking aggregate.
    /// </summary>
    public enum BookingType
    {
        Single,
        Group,
        MultiSlot,
    }
}
