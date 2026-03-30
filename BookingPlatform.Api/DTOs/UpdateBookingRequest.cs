using BookingPlatform.Api.Entities;

namespace BookingPlatform.Api.DTOs
{
    public class UpdateBookingRequest : CreateBookingRequest
    {
        public BookingStatus Status { get; set; }
    }
}
