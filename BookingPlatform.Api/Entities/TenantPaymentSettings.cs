namespace BookingPlatform.Api.Entities
{
    public class TenantPaymentSettings
    {
        public int     TenantId          { get; set; }
        public Tenant? Tenant            { get; set; }

        // ── Cash ─────────────────────────────────────────────────────────────
        public bool    AcceptCash        { get; set; }

        // ── Online ────────────────────────────────────────────────────────────
        public bool    AcceptOnline      { get; set; }

        // ── CC Avenue ─────────────────────────────────────────────────────────
        public bool    CcAvenueEnabled      { get; set; }
        public string? CcAvenueMerchantId   { get; set; }
        public string? CcAvenueAccessCode   { get; set; }
        public string? CcAvenueWorkingKey   { get; set; }

        // ── Magnati ───────────────────────────────────────────────────────────
        public bool    MagnatiEnabled       { get; set; }
        public string? MagnatiApiKey        { get; set; }
        public string? MagnatiMerchantId    { get; set; }
        public string? MagnatiSecretKey     { get; set; }
    }
}
