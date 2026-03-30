using System.Text;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.UseInlineDefinitionsForEnums();

    // Unique schema IDs for generic types like ServiceResult<T>
    options.CustomSchemaIds(type =>
    {
        if (!type.IsGenericType)
            return type.FullName?.Replace("+", "_") ?? type.Name;

        var baseName  = type.GetGenericTypeDefinition().FullName!
                           .Replace("+", "_")
                           .Split('`')[0];
        var typeArgs  = string.Join("_", type.GetGenericArguments()
                           .Select(a => a.Name));
        return $"{baseName}_{typeArgs}";
    });

    // Prevent ambiguous-action errors from surfacing as 500s
    options.ResolveConflictingActions(apiDesc => apiDesc.First());
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer      = builder.Configuration["Jwt:Issuer"],
            ValidAudience    = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<IComplaintService, ComplaintService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSingleton<IEmailService, EmailService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    SeedData(db);
}

app.UseHttpsRedirection();

app.UseCors("FrontendDev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void SeedData(AppDbContext db)
{
    // Ensure a default tenant exists
    var defaultTenant = db.Tenants.FirstOrDefault(t => t.Slug == "default");
    if (defaultTenant is null)
    {
        defaultTenant = new Tenant
        {
            Name         = "Default Tenant",
            Slug         = "default",
            ContactEmail = "admin@example.com",
            IsActive     = true,
            CreatedAt    = DateTime.UtcNow
        };
        db.Tenants.Add(defaultTenant);
        db.SaveChanges();
    }

    UpsertUser(db, "Alice Johnson", "alice@example.com", "password123", Roles.Customer,    defaultTenant.Id);
    UpsertUser(db, "Admin User",    "admin@example.com", "password123", Roles.TenantAdmin, defaultTenant.Id);
    UpsertUser(db, "Super Admin",   "superadmin@dynovative.com", "password123", Roles.SuperAdmin, null);
    db.SaveChanges();

    if (!db.Facilities.Any())
    {
        db.Facilities.AddRange(
            new Facility { Name = "Main Hall",     Location = "Building A", Capacity = 50, TenantId = defaultTenant.Id, IsActive = true },
            new Facility { Name = "Outdoor Court", Location = "West Wing",  Capacity = 20, TenantId = defaultTenant.Id, IsActive = true }
        );
        db.SaveChanges();
    }

    if (!db.Activities.Any())
    {
        db.Activities.AddRange(
            new Activity { Name = "Yoga",       DurationMinutes = 60, TenantId = defaultTenant.Id, IsActive = true },
            new Activity { Name = "Pilates",    DurationMinutes = 45, TenantId = defaultTenant.Id, IsActive = true },
            new Activity { Name = "Spin Class", DurationMinutes = 30, TenantId = defaultTenant.Id, IsActive = true }
        );
        db.SaveChanges();
    }

    if (!db.Instructors.Any())
    {
        db.Instructors.AddRange(
            new Instructor { Name = "Sara Lee",   Expertise = "Yoga",    ExperienceYears = 8, TenantId = defaultTenant.Id, IsActive = true },
            new Instructor { Name = "Mike Brown", Expertise = "Cycling", ExperienceYears = 5, TenantId = defaultTenant.Id, IsActive = true }
        );
        db.SaveChanges();
    }
}

static void UpsertUser(AppDbContext db, string fullName, string email, string password, string role, int? tenantId)
{
    var existing = db.Users.FirstOrDefault(u => u.Email == email);
    if (existing is null)
    {
        db.Users.Add(new User
        {
            FullName     = fullName,
            Email        = email,
            PasswordHash = PasswordHelper.Hash(password),
            Role         = role,
            TenantId     = tenantId
        });
    }
    else
    {
        if (string.IsNullOrEmpty(existing.PasswordHash))
            existing.PasswordHash = PasswordHelper.Hash(password);

        existing.Role     = role;
        existing.TenantId = tenantId;

        if (existing.FullName != fullName)
            existing.FullName = fullName;
    }
}