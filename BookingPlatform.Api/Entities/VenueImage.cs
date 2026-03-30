namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// A photo uploaded for a Venue (logo, cover, or gallery image).
    /// Images are stored as physical files on the server; this entity
    /// records the stored filename, original name, and display metadata.
    /// </summary>
    public class VenueImage
    {
        public int    Id               { get; set; }
        public int    VenueId          { get; set; }
        public Venue? Venue            { get; set; }

        /// <summary>Filename as saved on disk (GUID-based to avoid collisions).</summary>
        public string FileName         { get; set; } = string.Empty;

        /// <summary>Original name the user uploaded.</summary>
        public string OriginalFileName { get; set; } = string.Empty;

        /// <summary>File size in bytes.</summary>
        public long   FileSize         { get; set; }

        /// <summary>MIME type, e.g. "image/jpeg".</summary>
        public string ContentType      { get; set; } = string.Empty;

        /// <summary>When true, this image is used as the primary/hero image.</summary>
        public bool   IsPrimary        { get; set; }

        /// <summary>Optional caption shown in the gallery.</summary>
        public string? Caption         { get; set; }

        /// <summary>Lower numbers appear first in the gallery.</summary>
        public int    SortOrder        { get; set; }
    }
}
