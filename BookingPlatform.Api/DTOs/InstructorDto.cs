namespace BookingPlatform.Api.DTOs
{
    public class CreateInstructorRequest
    {
        public string  Name             { get; set; } = string.Empty;
        public string  Expertise        { get; set; } = string.Empty;
        public int     ExperienceYears  { get; set; }
        public string? Bio              { get; set; }
        public string? ExpertiseSummary { get; set; }
        public string? ProfileImageUrl  { get; set; }
        public string? ContactEmail     { get; set; }
        public string? ContactPhone     { get; set; }
    }

    public class InstructorResponse
    {
        public int     Id               { get; set; }
        public string  Name             { get; set; } = string.Empty;
        public string  Expertise        { get; set; } = string.Empty;
        public int     ExperienceYears  { get; set; }
        public int     TenantId         { get; set; }
        public string? Bio              { get; set; }
        public string? ExpertiseSummary { get; set; }
        public string? ProfileImageUrl  { get; set; }
        public string? ContactEmail     { get; set; }
        public string? ContactPhone     { get; set; }
        public bool    IsActive         { get; set; }
    }
}
