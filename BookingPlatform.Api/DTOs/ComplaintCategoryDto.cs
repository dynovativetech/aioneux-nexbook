using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.DTOs
{
    public class ComplaintCategoryDto
    {
        public int    Id       { get; set; }
        public string Name     { get; set; } = string.Empty;
        public bool   IsActive { get; set; }
        public int    SortOrder { get; set; }
    }

    public class CreateComplaintCategoryRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateComplaintCategoryRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
