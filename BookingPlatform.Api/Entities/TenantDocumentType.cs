namespace BookingPlatform.Api.Entities
{
    /// <summary>Global document-type catalogue managed by SuperAdmin (e.g. "Trade License", "TRN Certificate").</summary>
    public class TenantDocumentType
    {
        public int    Id          { get; set; }
        public string Name        { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool   IsRequired  { get; set; }
        public int    SortOrder   { get; set; }
        public bool   IsActive    { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<TenantDocument> Documents { get; set; } = [];
    }
}
