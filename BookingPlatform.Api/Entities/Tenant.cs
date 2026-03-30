namespace BookingPlatform.Api.Entities
{
    public class Tenant
    {
        public int      Id               { get; set; }

        // ── Company info ──────────────────────────────────────────────────────
        /// <summary>Trading / display name shown throughout the platform.</summary>
        public string  Name              { get; set; } = string.Empty;

        /// <summary>URL-safe unique identifier, e.g. "innovative-tech". Auto-generated from Name.</summary>
        public string  Slug              { get; set; } = string.Empty;

        /// <summary>Tenant's NexBook booking URL, e.g. "innovative-tech.nexbook.app".</summary>
        public string? LoginUrl          { get; set; }

        public string  ContactEmail      { get; set; } = string.Empty;
        public string? ContactPhone      { get; set; }
        public string? CompanyMobile     { get; set; }
        public string? Website           { get; set; }
        public string? LogoUrl           { get; set; }

        /// <summary>Tax Registration Number (TRN).</summary>
        public string? TRN               { get; set; }

        // ── Company physical address ──────────────────────────────────────────
        public int?    DefaultCountryId  { get; set; }
        public Country? DefaultCountry  { get; set; }
        public string? StateProvince     { get; set; }
        public string? DefaultCityText   { get; set; }
        public string? Street            { get; set; }
        public string? PostalCode        { get; set; }

        // ── Contact person ────────────────────────────────────────────────────
        public string? ContactTitle         { get; set; }
        public string? ContactFirstName     { get; set; }
        public string? ContactLastName      { get; set; }
        public string? ContactMobilePhone   { get; set; }
        /// <summary>Contact person's own email — used as the TenantAdmin login email.</summary>
        public string? ContactPersonEmail   { get; set; }
        // Contact person's own address
        public int?    ContactCountryId     { get; set; }
        public Country? ContactCountry      { get; set; }
        public string? ContactState         { get; set; }
        public string? ContactCityText      { get; set; }
        public string? ContactStreet        { get; set; }
        public string? ContactPostalCode    { get; set; }

        // ── Status ────────────────────────────────────────────────────────────
        public bool     IsActive            { get; set; } = true;
        public DateTime CreatedAt           { get; set; } = DateTime.UtcNow;

        // ── Navigation ────────────────────────────────────────────────────────
        public ICollection<User>                       Users                { get; set; } = [];
        public TenantPaymentSettings?                  PaymentSettings      { get; set; }
        public TenantEmailSettings?                    EmailSettings        { get; set; }
        public ICollection<TenantNotificationSettings> NotificationSettings { get; set; } = [];
        public ICollection<TenantDocument>             Documents            { get; set; } = [];
    }
}
