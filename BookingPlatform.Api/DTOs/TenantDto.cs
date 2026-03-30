namespace BookingPlatform.Api.DTOs
{
    // ── Payment settings ──────────────────────────────────────────────────────

    public class PaymentSettingsDto
    {
        public bool    AcceptCash           { get; set; }
        public bool    AcceptOnline         { get; set; }
        // CC Avenue (only relevant when AcceptOnline = true)
        public bool    CcAvenueEnabled      { get; set; }
        public string? CcAvenueMerchantId   { get; set; }
        public string? CcAvenueAccessCode   { get; set; }
        public string? CcAvenueWorkingKey   { get; set; }
        // Magnati (only relevant when AcceptOnline = true)
        public bool    MagnatiEnabled       { get; set; }
        public string? MagnatiApiKey        { get; set; }
        public string? MagnatiMerchantId    { get; set; }
        public string? MagnatiSecretKey     { get; set; }
    }

    // ── Document types ────────────────────────────────────────────────────────

    public class TenantDocumentTypeResponse
    {
        public int     Id          { get; set; }
        public string  Name        { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool    IsRequired  { get; set; }
        public int     SortOrder   { get; set; }
        public bool    IsActive    { get; set; }
    }

    public class CreateDocumentTypeRequest
    {
        public string  Name        { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool    IsRequired  { get; set; }
        public int     SortOrder   { get; set; }
    }

    // ── Tenant documents ──────────────────────────────────────────────────────

    public class TenantDocumentResponse
    {
        public int     Id               { get; set; }
        public int     DocumentTypeId   { get; set; }
        public string  DocumentTypeName { get; set; } = string.Empty;
        public string  OriginalFileName { get; set; } = string.Empty;
        public long    FileSizeBytes    { get; set; }
        public string? Notes            { get; set; }
        public DateTime UploadedAt      { get; set; }
        public string  DownloadUrl      { get; set; } = string.Empty;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public class CreateTenantRequest
    {
        // Company
        public string  Name              { get; set; } = string.Empty;
        public string  Slug              { get; set; } = string.Empty;
        public string? LoginUrl          { get; set; }
        public string  ContactEmail      { get; set; } = string.Empty;
        public string? ContactPhone      { get; set; }
        public string? CompanyMobile     { get; set; }
        public string? Website           { get; set; }
        public string? LogoUrl           { get; set; }
        public string? TRN               { get; set; }
        // Company address (Country → State → City → Street → PostalCode)
        public int?    DefaultCountryId  { get; set; }
        public string? StateProvince     { get; set; }
        public string? DefaultCityText   { get; set; }
        public string? Street            { get; set; }
        public string? PostalCode        { get; set; }
        // Contact person
        public string? ContactTitle         { get; set; }
        public string? ContactFirstName     { get; set; }
        public string? ContactLastName      { get; set; }
        public string? ContactMobilePhone   { get; set; }
        /// <summary>Contact person's email — used as the TenantAdmin login email.</summary>
        public string? ContactPersonEmail   { get; set; }
        // Contact person address
        public int?    ContactCountryId     { get; set; }
        public string? ContactState         { get; set; }
        public string? ContactCityText      { get; set; }
        public string? ContactStreet        { get; set; }
        public string? ContactPostalCode    { get; set; }
        // Options
        public bool    SendWelcomeEmail     { get; set; }
        // Payment (optional at creation)
        public PaymentSettingsDto? PaymentSettings { get; set; }
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public class UpdateTenantRequest
    {
        // Company
        public string  Name              { get; set; } = string.Empty;
        public string? LoginUrl          { get; set; }
        public string  ContactEmail      { get; set; } = string.Empty;
        public string? ContactPhone      { get; set; }
        public string? CompanyMobile     { get; set; }
        public string? Website           { get; set; }
        public string? LogoUrl           { get; set; }
        public string? TRN               { get; set; }
        // Company address
        public int?    DefaultCountryId  { get; set; }
        public string? StateProvince     { get; set; }
        public string? DefaultCityText   { get; set; }
        public string? Street            { get; set; }
        public string? PostalCode        { get; set; }
        // Contact person
        public string? ContactTitle         { get; set; }
        public string? ContactFirstName     { get; set; }
        public string? ContactLastName      { get; set; }
        public string? ContactMobilePhone   { get; set; }
        public string? ContactPersonEmail   { get; set; }
        // Contact person address
        public int?    ContactCountryId     { get; set; }
        public string? ContactState         { get; set; }
        public string? ContactCityText      { get; set; }
        public string? ContactStreet        { get; set; }
        public string? ContactPostalCode    { get; set; }
    }

    // ── Responses ─────────────────────────────────────────────────────────────

    public class TenantResponse
    {
        public int      Id                { get; set; }
        // Company
        public string   Name              { get; set; } = string.Empty;
        public string   Slug              { get; set; } = string.Empty;
        public string?  LoginUrl          { get; set; }
        public string   ContactEmail      { get; set; } = string.Empty;
        public string?  ContactPhone      { get; set; }
        public string?  CompanyMobile     { get; set; }
        public string?  Website           { get; set; }
        public string?  LogoUrl           { get; set; }
        public string?  TRN               { get; set; }
        // Company address
        public int?     DefaultCountryId  { get; set; }
        public string?  DefaultCountryName { get; set; }
        public string?  StateProvince     { get; set; }
        public string?  DefaultCityText   { get; set; }
        public string?  Street            { get; set; }
        public string?  PostalCode        { get; set; }
        // Contact person
        public string?  ContactTitle         { get; set; }
        public string?  ContactFirstName     { get; set; }
        public string?  ContactLastName      { get; set; }
        public string?  ContactMobilePhone   { get; set; }
        public string?  ContactPersonEmail   { get; set; }
        // Contact person address
        public int?     ContactCountryId     { get; set; }
        public string?  ContactCountryName   { get; set; }
        public string?  ContactState         { get; set; }
        public string?  ContactCityText      { get; set; }
        public string?  ContactStreet        { get; set; }
        public string?  ContactPostalCode    { get; set; }
        // Status
        public bool     IsActive          { get; set; }
        public DateTime CreatedAt         { get; set; }
    }

    /// <summary>Only returned from POST /api/tenants. TempPassword is null on all subsequent reads.</summary>
    public class CreateTenantResponse : TenantResponse
    {
        public string? TempPassword { get; set; }
    }
}
