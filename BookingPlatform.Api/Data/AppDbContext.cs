using Microsoft.EntityFrameworkCore;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;

namespace BookingPlatform.Api.Data
{
    public class AppDbContext : DbContext
    {
        private readonly ITenantContext? _tenantContext;

        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext? tenantContext = null)
            : base(options)
        {
            _tenantContext = tenantContext;
        }

        // ── Core tables ──────────────────────────────────────────────────────
        public DbSet<Tenant>                Tenants               { get; set; }
        public DbSet<TenantPaymentSettings> TenantPaymentSettings { get; set; }
        public DbSet<TenantDocumentType>    TenantDocumentTypes   { get; set; }
        public DbSet<TenantDocument>        TenantDocuments       { get; set; }
        public DbSet<User>                  Users                 { get; set; }

        // ── Location hierarchy ───────────────────────────────────────────────
        public DbSet<Country>              Countries              { get; set; }
        public DbSet<City>                 Cities                 { get; set; }
        public DbSet<Area>                 Areas                  { get; set; }
        public DbSet<Community>            Communities            { get; set; }
        public DbSet<Venue>                Venues                 { get; set; }

        // ── Venue domain ─────────────────────────────────────────────────────
        public DbSet<VenueImage>                  VenueImages                  { get; set; }
        public DbSet<VenueOperatingHours>         VenueOperatingHours          { get; set; }
        public DbSet<VenueAmenity>                VenueAmenities               { get; set; }
        public DbSet<VenueOrganizer>              VenueOrganizers              { get; set; }

        // ── Facility domain ──────────────────────────────────────────────────
        public DbSet<Facility>                    Facilities                   { get; set; }
        public DbSet<FacilityImage>               FacilityImages               { get; set; }
        public DbSet<FacilityActivity>            FacilityActivities           { get; set; }
        public DbSet<FacilityOperatingHours>      FacilityOperatingHours       { get; set; }
        public DbSet<Activity>                    Activities                   { get; set; }
        public DbSet<Instructor>                  Instructors                  { get; set; }
        public DbSet<InstructorSkill>             InstructorSkills             { get; set; }

        // ── Tenant configuration ─────────────────────────────────────────────
        public DbSet<TenantEmailSettings>         TenantEmailSettings          { get; set; }
        public DbSet<TenantNotificationSettings>  TenantNotificationSettings   { get; set; }

        // ── Booking domain ───────────────────────────────────────────────────
        public DbSet<Booking>              Bookings               { get; set; }
        public DbSet<BookingParticipant>   BookingParticipants    { get; set; }
        public DbSet<FacilityReservation>  FacilityReservations   { get; set; }
        public DbSet<InstructorReservation> InstructorReservations { get; set; }

        // ── Support tables ───────────────────────────────────────────────────
        public DbSet<Complaint>            Complaints             { get; set; }
        public DbSet<ComplaintComment>     ComplaintComments      { get; set; }
        public DbSet<AuditLog>             AuditLogs              { get; set; }
        public DbSet<NotificationLog>      NotificationLogs       { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── Tenant ────────────────────────────────────────────────────────
            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.Property(t => t.Name).HasMaxLength(200).IsRequired();
                entity.Property(t => t.Slug).HasMaxLength(100).IsRequired();
                entity.HasIndex(t => t.Slug).IsUnique();
                entity.Property(t => t.LoginUrl).HasMaxLength(300);
                entity.Property(t => t.ContactEmail).HasMaxLength(254).IsRequired();
                entity.Property(t => t.ContactPhone).HasMaxLength(30);
                entity.Property(t => t.CompanyMobile).HasMaxLength(30);
                entity.Property(t => t.Website).HasMaxLength(300);
                entity.Property(t => t.LogoUrl).HasMaxLength(500);
                entity.Property(t => t.TRN).HasMaxLength(50);
                entity.Property(t => t.Street).HasMaxLength(300);
                entity.Property(t => t.DefaultCityText).HasMaxLength(150);
                entity.Property(t => t.StateProvince).HasMaxLength(150);
                entity.Property(t => t.PostalCode).HasMaxLength(20);
                entity.Property(t => t.ContactTitle).HasMaxLength(20);
                entity.Property(t => t.ContactFirstName).HasMaxLength(100);
                entity.Property(t => t.ContactLastName).HasMaxLength(100);
                entity.Property(t => t.ContactMobilePhone).HasMaxLength(30);
                entity.Property(t => t.ContactPersonEmail).HasMaxLength(254);
                entity.Property(t => t.ContactState).HasMaxLength(150);
                entity.Property(t => t.ContactCityText).HasMaxLength(150);
                entity.Property(t => t.ContactStreet).HasMaxLength(300);
                entity.Property(t => t.ContactPostalCode).HasMaxLength(20);

                entity.HasOne(t => t.DefaultCountry)
                    .WithMany()
                    .HasForeignKey(t => t.DefaultCountryId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.ContactCountry)
                    .WithMany()
                    .HasForeignKey(t => t.ContactCountryId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── TenantDocumentType ────────────────────────────────────────────
            modelBuilder.Entity<TenantDocumentType>(entity =>
            {
                entity.Property(d => d.Name).HasMaxLength(150).IsRequired();
                entity.Property(d => d.Description).HasMaxLength(500);
            });

            // ── TenantDocument ────────────────────────────────────────────────
            modelBuilder.Entity<TenantDocument>(entity =>
            {
                entity.HasOne(d => d.Tenant)
                    .WithMany(t => t.Documents)
                    .HasForeignKey(d => d.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.DocumentType)
                    .WithMany(dt => dt.Documents)
                    .HasForeignKey(d => d.DocumentTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(d => d.OriginalFileName).HasMaxLength(500).IsRequired();
                entity.Property(d => d.StoredFileName).HasMaxLength(500).IsRequired();
                entity.Property(d => d.FilePath).HasMaxLength(1000).IsRequired();
                entity.Property(d => d.ContentType).HasMaxLength(100).IsRequired();
                entity.Property(d => d.Notes).HasMaxLength(500);
                entity.HasIndex(d => d.TenantId);
            });

            // ── TenantPaymentSettings ─────────────────────────────────────────
            modelBuilder.Entity<TenantPaymentSettings>(entity =>
            {
                entity.HasKey(p => p.TenantId);

                entity.HasOne(p => p.Tenant)
                    .WithOne(t => t.PaymentSettings)
                    .HasForeignKey<TenantPaymentSettings>(p => p.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(p => p.CcAvenueMerchantId).HasMaxLength(500);
                entity.Property(p => p.CcAvenueAccessCode).HasMaxLength(500);
                entity.Property(p => p.CcAvenueWorkingKey).HasMaxLength(500);
                entity.Property(p => p.MagnatiApiKey).HasMaxLength(500);
                entity.Property(p => p.MagnatiMerchantId).HasMaxLength(500);
                entity.Property(p => p.MagnatiSecretKey).HasMaxLength(500);
            });

            // ── User ──────────────────────────────────────────────────────────
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasOne(u => u.Tenant)
                    .WithMany(t => t.Users)
                    .HasForeignKey(u => u.TenantId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(u => u.Role).HasMaxLength(50).IsRequired();
                entity.HasIndex(u => u.TenantId);
            });

            // ── Country ───────────────────────────────────────────────────────
            modelBuilder.Entity<Country>(entity =>
            {
                entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
                entity.Property(c => c.Code).HasMaxLength(2).IsRequired();
                entity.HasIndex(c => c.Code).IsUnique();
            });

            // ── City ──────────────────────────────────────────────────────────
            modelBuilder.Entity<City>(entity =>
            {
                entity.HasOne(c => c.Country)
                    .WithMany(co => co.Cities)
                    .HasForeignKey(c => c.CountryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.Name).HasMaxLength(150).IsRequired();
            });

            // ── Area ──────────────────────────────────────────────────────────
            modelBuilder.Entity<Area>(entity =>
            {
                entity.HasOne(a => a.City)
                    .WithMany(c => c.Areas)
                    .HasForeignKey(a => a.CityId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Tenant)
                    .WithMany()
                    .HasForeignKey(a => a.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(a => a.Name).HasMaxLength(150).IsRequired();
                entity.HasIndex(a => a.TenantId);

                entity.HasQueryFilter(a => _tenantContext == null || _tenantContext.IsSuperAdmin || a.TenantId == _tenantContext.TenantId);
            });

            // ── Community ─────────────────────────────────────────────────────
            modelBuilder.Entity<Community>(entity =>
            {
                entity.HasOne(c => c.Area)
                    .WithMany(a => a.Communities)
                    .HasForeignKey(c => c.AreaId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Tenant)
                    .WithMany()
                    .HasForeignKey(c => c.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.Name).HasMaxLength(200).IsRequired();
                entity.Property(c => c.Description).HasMaxLength(1000);
                entity.HasIndex(c => c.TenantId);

                entity.HasQueryFilter(c => _tenantContext == null || _tenantContext.IsSuperAdmin || c.TenantId == _tenantContext.TenantId);
            });

            // ── Venue ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Venue>(entity =>
            {
                entity.HasOne(v => v.Community)
                    .WithMany(c => c.Venues)
                    .HasForeignKey(v => v.CommunityId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(v => v.Tenant)
                    .WithMany()
                    .HasForeignKey(v => v.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(v => v.Name).HasMaxLength(200).IsRequired();
                entity.Property(v => v.Address).HasMaxLength(500).IsRequired();
                entity.Property(v => v.ShortDescription).HasMaxLength(500);
                entity.Property(v => v.Description).HasMaxLength(4000);
                entity.Property(v => v.LogoUrl).HasMaxLength(500);
                entity.Property(v => v.CoverImageUrl).HasMaxLength(500);
                entity.Property(v => v.GoogleMapsUrl).HasMaxLength(1000);
                entity.Property(v => v.Phone).HasMaxLength(30);
                entity.Property(v => v.Mobile).HasMaxLength(30);
                entity.Property(v => v.Website).HasMaxLength(300);
                entity.Property(v => v.ContactPersonName).HasMaxLength(150);
                entity.Property(v => v.ContactPersonEmail).HasMaxLength(254);
                entity.Property(v => v.ContactPersonPhone).HasMaxLength(30);
                entity.Property(v => v.ContactPersonMobile).HasMaxLength(30);
                entity.HasIndex(v => v.TenantId);

                entity.HasQueryFilter(v => _tenantContext == null || _tenantContext.IsSuperAdmin || v.TenantId == _tenantContext.TenantId);
            });

            // ── VenueImage ────────────────────────────────────────────────────
            modelBuilder.Entity<VenueImage>(entity =>
            {
                entity.HasOne(vi => vi.Venue)
                    .WithMany(v => v.Images)
                    .HasForeignKey(vi => vi.VenueId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(vi => vi.FileName).HasMaxLength(500).IsRequired();
                entity.Property(vi => vi.OriginalFileName).HasMaxLength(500).IsRequired();
                entity.Property(vi => vi.ContentType).HasMaxLength(100).IsRequired();
                entity.Property(vi => vi.Caption).HasMaxLength(300);
                entity.HasIndex(vi => vi.VenueId);
            });

            // ── VenueOperatingHours ───────────────────────────────────────────
            modelBuilder.Entity<VenueOperatingHours>(entity =>
            {
                entity.HasOne(oh => oh.Venue)
                    .WithMany(v => v.OperatingHours)
                    .HasForeignKey(oh => oh.VenueId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Unique: one row per day per venue
                entity.HasIndex(oh => new { oh.VenueId, oh.DayOfWeek }).IsUnique();
            });

            // ── VenueAmenity ──────────────────────────────────────────────────
            modelBuilder.Entity<VenueAmenity>(entity =>
            {
                entity.HasOne(a => a.Venue)
                    .WithMany(v => v.Amenities)
                    .HasForeignKey(a => a.VenueId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(a => a.Notes).HasMaxLength(500);
                // Unique: one row per amenity type per venue
                entity.HasIndex(a => new { a.VenueId, a.AmenityType }).IsUnique();
            });

            // ── VenueOrganizer ────────────────────────────────────────────────
            modelBuilder.Entity<VenueOrganizer>(entity =>
            {
                entity.HasKey(vo => new { vo.VenueId, vo.UserId });

                entity.HasOne(vo => vo.Venue)
                    .WithMany(v => v.Organizers)
                    .HasForeignKey(vo => vo.VenueId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(vo => vo.User)
                    .WithMany(u => u.VenueOrganizers)
                    .HasForeignKey(vo => vo.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(vo => vo.FirstName).HasMaxLength(100);
                entity.Property(vo => vo.LastName).HasMaxLength(100);
                entity.Property(vo => vo.Email).HasMaxLength(254);
                entity.Property(vo => vo.OfficialEmail).HasMaxLength(254);
                entity.Property(vo => vo.Phone).HasMaxLength(30);
                entity.Property(vo => vo.Mobile).HasMaxLength(30);
                entity.Property(vo => vo.Website).HasMaxLength(300);
            });

            // ── Facility ──────────────────────────────────────────────────────
            modelBuilder.Entity<Facility>(entity =>
            {
                entity.HasOne(f => f.Tenant)
                    .WithMany()
                    .HasForeignKey(f => f.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(f => f.Venue)
                    .WithMany(v => v.Facilities)
                    .HasForeignKey(f => f.VenueId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(f => f.Name).HasMaxLength(200).IsRequired();
                entity.Property(f => f.Location).HasMaxLength(500);
                entity.Property(f => f.Code).HasMaxLength(50);
                entity.Property(f => f.Description).HasMaxLength(2000);
                entity.Property(f => f.ShortDescription).HasMaxLength(500);
                entity.Property(f => f.MapAddress).HasMaxLength(500);
                entity.Property(f => f.PhysicalAddress).HasMaxLength(500);
                entity.Property(f => f.ContactPersonName).HasMaxLength(150);
                entity.Property(f => f.ContactEmail).HasMaxLength(254);
                entity.Property(f => f.ContactPhone).HasMaxLength(30);
                entity.Property(f => f.BookingConfirmationEmail).HasMaxLength(254);

                // SlotDurationMinutes and MaxConsecutiveSlots use DB default values
                entity.Property(f => f.SlotDurationMinutes).HasDefaultValue(60);
                entity.Property(f => f.MaxConsecutiveSlots).HasDefaultValue(3);

                entity.HasIndex(f => f.TenantId);

                entity.HasQueryFilter(f => _tenantContext == null || _tenantContext.IsSuperAdmin || f.TenantId == _tenantContext.TenantId);
            });

            // ── FacilityActivity ──────────────────────────────────────────────
            modelBuilder.Entity<FacilityActivity>(entity =>
            {
                entity.HasKey(fa => new { fa.FacilityId, fa.ActivityId });

                entity.HasOne(fa => fa.Facility)
                    .WithMany(f => f.FacilityActivities)
                    .HasForeignKey(fa => fa.FacilityId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(fa => fa.Activity)
                    .WithMany(a => a.FacilityActivities)
                    .HasForeignKey(fa => fa.ActivityId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ── FacilityOperatingHours ────────────────────────────────────────
            modelBuilder.Entity<FacilityOperatingHours>(entity =>
            {
                entity.HasOne(oh => oh.Facility)
                    .WithMany(f => f.OperatingHours)
                    .HasForeignKey(oh => oh.FacilityId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Unique: one row per day per facility
                entity.HasIndex(oh => new { oh.FacilityId, oh.DayOfWeek }).IsUnique();
            });

            // ── FacilityImage ─────────────────────────────────────────────────
            modelBuilder.Entity<FacilityImage>(entity =>
            {
                entity.HasOne(fi => fi.Facility)
                    .WithMany(f => f.Images)
                    .HasForeignKey(fi => fi.FacilityId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(fi => fi.ImageUrl).HasMaxLength(500).IsRequired();
            });

            // ── Activity ──────────────────────────────────────────────────────
            modelBuilder.Entity<Activity>(entity =>
            {
                entity.HasOne(a => a.Tenant)
                    .WithMany()
                    .HasForeignKey(a => a.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(a => a.Name).HasMaxLength(200).IsRequired();
                entity.Property(a => a.Description).HasMaxLength(1000);
                entity.Property(a => a.Category).HasMaxLength(100);
                entity.Property(a => a.Price).HasColumnType("decimal(18,2)");
                entity.HasIndex(a => a.TenantId);

                entity.HasQueryFilter(a => _tenantContext == null || _tenantContext.IsSuperAdmin || a.TenantId == _tenantContext.TenantId);
            });

            // ── Instructor ────────────────────────────────────────────────────
            modelBuilder.Entity<Instructor>(entity =>
            {
                entity.HasOne(i => i.Tenant)
                    .WithMany()
                    .HasForeignKey(i => i.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(i => i.Name).HasMaxLength(150).IsRequired();
                entity.Property(i => i.Expertise).HasMaxLength(100).IsRequired();
                entity.Property(i => i.Bio).HasMaxLength(1000);
                entity.Property(i => i.ExpertiseSummary).HasMaxLength(300);
                entity.Property(i => i.ProfileImageUrl).HasMaxLength(500);
                entity.Property(i => i.ContactEmail).HasMaxLength(254);
                entity.Property(i => i.ContactPhone).HasMaxLength(30);
                entity.HasIndex(i => i.TenantId);

                entity.HasQueryFilter(i => _tenantContext == null || _tenantContext.IsSuperAdmin || i.TenantId == _tenantContext.TenantId);
            });

            // ── Booking ──────────────────────────────────────────────────────
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasOne(b => b.Tenant)
                    .WithMany()
                    .HasForeignKey(b => b.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.User)
                    .WithMany(u => u.Bookings)
                    .HasForeignKey(b => b.UserId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.Facility)
                    .WithMany(f => f.Bookings)
                    .HasForeignKey(b => b.FacilityId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.Activity)
                    .WithMany(a => a.Bookings)
                    .HasForeignKey(b => b.ActivityId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.Instructor)
                    .WithMany(i => i.Bookings)
                    .HasForeignKey(b => b.InstructorId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(b => b.Notes).HasMaxLength(500);

                entity.HasIndex(b => b.TenantId);
                entity.HasIndex(b => b.UserId);
                entity.HasIndex(b => b.Status);
                entity.HasIndex(b => new { b.FacilityId, b.StartTime, b.EndTime });

                entity.HasQueryFilter(b => _tenantContext == null || _tenantContext.IsSuperAdmin || b.TenantId == _tenantContext.TenantId);
            });

            // ── BookingParticipant ────────────────────────────────────────────
            modelBuilder.Entity<BookingParticipant>(entity =>
            {
                entity.HasOne(p => p.Booking)
                    .WithMany(b => b.Participants)
                    .HasForeignKey(p => p.BookingId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(p => p.FullName).HasMaxLength(150).IsRequired();
                entity.Property(p => p.Email).HasMaxLength(254);
                entity.Property(p => p.Phone).HasMaxLength(30);
            });

            // ── FacilityReservation ────────────────────────────────────────────
            modelBuilder.Entity<FacilityReservation>(entity =>
            {
                entity.HasOne(r => r.Booking)
                    .WithMany(b => b.FacilityReservations)
                    .HasForeignKey(r => r.BookingId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.Facility)
                    .WithMany(f => f.FacilityReservations)
                    .HasForeignKey(r => r.FacilityId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(r => new { r.FacilityId, r.StartTime, r.EndTime });
                entity.HasIndex(r => r.Status);
            });

            // ── InstructorReservation ──────────────────────────────────────────
            modelBuilder.Entity<InstructorReservation>(entity =>
            {
                entity.HasOne(r => r.Booking)
                    .WithMany(b => b.InstructorReservations)
                    .HasForeignKey(r => r.BookingId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.Instructor)
                    .WithMany(i => i.InstructorReservations)
                    .HasForeignKey(r => r.InstructorId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Activity)
                    .WithMany(a => a.InstructorReservations)
                    .HasForeignKey(r => r.ActivityId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(r => new { r.InstructorId, r.StartTime, r.EndTime });
                entity.HasIndex(r => r.Status);
            });

            // ── InstructorSkill ────────────────────────────────────────────────
            modelBuilder.Entity<InstructorSkill>(entity =>
            {
                entity.HasKey(s => new { s.InstructorId, s.ActivityId });

                entity.HasOne(s => s.Instructor)
                    .WithMany(i => i.Skills)
                    .HasForeignKey(s => s.InstructorId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(s => s.Activity)
                    .WithMany(a => a.InstructorSkills)
                    .HasForeignKey(s => s.ActivityId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(s => s.CertificationNote).HasMaxLength(255);
            });

            // ── Complaint ─────────────────────────────────────────────────────
            modelBuilder.Entity<Complaint>(entity =>
            {
                entity.HasOne(c => c.Tenant)
                    .WithMany()
                    .HasForeignKey(c => c.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Booking)
                    .WithMany(b => b.Complaints)
                    .HasForeignKey(c => c.BookingId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.User)
                    .WithMany(u => u.Complaints)
                    .HasForeignKey(c => c.UserId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.Title).HasMaxLength(200).IsRequired();
                entity.Property(c => c.Description).HasMaxLength(2000).IsRequired();
                entity.HasIndex(c => c.TenantId);

                entity.HasQueryFilter(c => _tenantContext == null || _tenantContext.IsSuperAdmin || c.TenantId == _tenantContext.TenantId);
            });

            // ── ComplaintComment ──────────────────────────────────────────────
            modelBuilder.Entity<ComplaintComment>(entity =>
            {
                entity.HasOne(cc => cc.Complaint)
                    .WithMany(c => c.Comments)
                    .HasForeignKey(cc => cc.ComplaintId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cc => cc.Author)
                    .WithMany(u => u.Comments)
                    .HasForeignKey(cc => cc.AuthorId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(cc => cc.Text).HasMaxLength(1000).IsRequired();
            });

            // ── AuditLog ──────────────────────────────────────────────────────
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasOne(a => a.Tenant)
                    .WithMany()
                    .HasForeignKey(a => a.TenantId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(a => a.Action).HasMaxLength(50).IsRequired();
                entity.Property(a => a.EntityType).HasMaxLength(100).IsRequired();
                entity.Property(a => a.EntityName).HasMaxLength(255);
                entity.Property(a => a.Details).HasMaxLength(1000);
                entity.Property(a => a.ActorEmail).HasMaxLength(255).IsRequired();
                entity.Property(a => a.ActorName).HasMaxLength(150).IsRequired();
                entity.Property(a => a.IpAddress).HasMaxLength(45);

                entity.HasIndex(a => a.TenantId);
                entity.HasIndex(a => a.Timestamp);
                entity.HasIndex(a => a.ActorId);
                entity.HasIndex(a => new { a.EntityType, a.EntityId });
            });

            // ── NotificationLog ───────────────────────────────────────────────
            modelBuilder.Entity<NotificationLog>(entity =>
            {
                entity.HasOne(n => n.Tenant)
                    .WithMany()
                    .HasForeignKey(n => n.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(n => n.Booking)
                    .WithMany()
                    .HasForeignKey(n => n.BookingId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(n => n.Event).HasMaxLength(100).IsRequired();
                entity.Property(n => n.Type).HasMaxLength(50).IsRequired();
                entity.Property(n => n.RecipientEmail).HasMaxLength(254).IsRequired();
                entity.Property(n => n.RecipientRole).HasMaxLength(50);
                entity.Property(n => n.Subject).HasMaxLength(500).IsRequired();
                entity.Property(n => n.ErrorMessage).HasMaxLength(1000);
                entity.HasIndex(n => n.TenantId);
                entity.HasIndex(n => n.EventType);

                entity.HasQueryFilter(n => _tenantContext == null || _tenantContext.IsSuperAdmin || n.TenantId == _tenantContext.TenantId);
            });

            // ── TenantEmailSettings ───────────────────────────────────────────
            modelBuilder.Entity<TenantEmailSettings>(entity =>
            {
                // PK is TenantId — one-to-one with Tenant
                entity.HasKey(es => es.TenantId);

                entity.HasOne(es => es.Tenant)
                    .WithOne(t => t.EmailSettings)
                    .HasForeignKey<TenantEmailSettings>(es => es.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(es => es.SmtpHost).HasMaxLength(300);
                entity.Property(es => es.SmtpUsername).HasMaxLength(254);
                entity.Property(es => es.SmtpPasswordEncrypted).HasMaxLength(1000);
                entity.Property(es => es.ApiKeyEncrypted).HasMaxLength(1000);
                entity.Property(es => es.FromEmail).HasMaxLength(254).IsRequired();
                entity.Property(es => es.FromName).HasMaxLength(150).IsRequired();
                entity.Property(es => es.ReplyToEmail).HasMaxLength(254);
            });

            // ── TenantNotificationSettings ────────────────────────────────────
            modelBuilder.Entity<TenantNotificationSettings>(entity =>
            {
                entity.HasOne(ns => ns.Tenant)
                    .WithMany(t => t.NotificationSettings)
                    .HasForeignKey(ns => ns.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                // One row per event type per tenant
                entity.HasIndex(ns => new { ns.TenantId, ns.EventType }).IsUnique();
                entity.HasIndex(ns => ns.TenantId);
            });
        }
    }
}
