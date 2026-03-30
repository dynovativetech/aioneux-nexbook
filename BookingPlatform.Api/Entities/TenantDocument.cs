namespace BookingPlatform.Api.Entities
{
    /// <summary>A file uploaded for a specific tenant against a document type.</summary>
    public class TenantDocument
    {
        public int     Id               { get; set; }
        public int     TenantId         { get; set; }
        public Tenant? Tenant           { get; set; }
        public int     DocumentTypeId   { get; set; }
        public TenantDocumentType? DocumentType { get; set; }

        public string  OriginalFileName { get; set; } = string.Empty;
        public string  StoredFileName   { get; set; } = string.Empty;
        public string  FilePath         { get; set; } = string.Empty;
        public string  ContentType      { get; set; } = string.Empty;
        public long    FileSizeBytes    { get; set; }
        public string? Notes            { get; set; }
        public DateTime UploadedAt      { get; set; } = DateTime.UtcNow;
    }
}
