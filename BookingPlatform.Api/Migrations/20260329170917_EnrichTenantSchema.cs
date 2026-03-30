using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnrichTenantSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactFirstName",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactLastName",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactMobilePhone",
                table: "Tenants",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactTitle",
                table: "Tenants",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultCityText",
                table: "Tenants",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DefaultCountryId",
                table: "Tenants",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoginUrl",
                table: "Tenants",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficialName",
                table: "Tenants",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "Tenants",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StateProvince",
                table: "Tenants",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Street",
                table: "Tenants",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Tenants",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TenantPaymentSettings",
                columns: table => new
                {
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    AcceptCash = table.Column<bool>(type: "bit", nullable: false),
                    AcceptOnline = table.Column<bool>(type: "bit", nullable: false),
                    CcAvenueEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CcAvenueMerchantId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CcAvenueAccessCode = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CcAvenueWorkingKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MagnatiEnabled = table.Column<bool>(type: "bit", nullable: false),
                    MagnatiApiKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MagnatiMerchantId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MagnatiSecretKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantPaymentSettings", x => x.TenantId);
                    table.ForeignKey(
                        name: "FK_TenantPaymentSettings_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_DefaultCountryId",
                table: "Tenants",
                column: "DefaultCountryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_Countries_DefaultCountryId",
                table: "Tenants",
                column: "DefaultCountryId",
                principalTable: "Countries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // ── Seed UAE country ──────────────────────────────────────────────
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM Countries WHERE Code = 'AE')
BEGIN
    SET IDENTITY_INSERT Countries ON;
    INSERT INTO Countries (Id, Name, Code) VALUES (1, 'United Arab Emirates', 'AE');
    SET IDENTITY_INSERT Countries OFF;
END
");

            // ── Seed UAE cities ───────────────────────────────────────────────
            migrationBuilder.Sql(@"
DECLARE @uaeId INT = (SELECT Id FROM Countries WHERE Code = 'AE');

IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Dubai' AND CountryId = @uaeId)
    INSERT INTO Cities (CountryId, Name) VALUES (@uaeId, 'Dubai');
IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Abu Dhabi' AND CountryId = @uaeId)
    INSERT INTO Cities (CountryId, Name) VALUES (@uaeId, 'Abu Dhabi');
IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Sharjah' AND CountryId = @uaeId)
    INSERT INTO Cities (CountryId, Name) VALUES (@uaeId, 'Sharjah');
IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Ajman' AND CountryId = @uaeId)
    INSERT INTO Cities (CountryId, Name) VALUES (@uaeId, 'Ajman');
IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Ras Al Khaimah' AND CountryId = @uaeId)
    INSERT INTO Cities (CountryId, Name) VALUES (@uaeId, 'Ras Al Khaimah');
IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Fujairah' AND CountryId = @uaeId)
    INSERT INTO Cities (CountryId, Name) VALUES (@uaeId, 'Fujairah');
IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Umm Al Quwain' AND CountryId = @uaeId)
    INSERT INTO Cities (CountryId, Name) VALUES (@uaeId, 'Umm Al Quwain');
");

            // ── Seed Dubai areas (template under TenantId = 1) ────────────────
            migrationBuilder.Sql(@"
DECLARE @dubaiId INT   = (SELECT TOP 1 Id FROM Cities WHERE Name = 'Dubai');
DECLARE @abudhabiId INT = (SELECT TOP 1 Id FROM Cities WHERE Name = 'Abu Dhabi');
DECLARE @sharjahId INT  = (SELECT TOP 1 Id FROM Cities WHERE Name = 'Sharjah');

-- Dubai areas
IF @dubaiId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'JVC' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'JVC');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Dubai Land' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Dubai Land');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Business Bay' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Business Bay');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Downtown Dubai' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Downtown Dubai');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Dubai Marina' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Dubai Marina');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'JBR' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'JBR');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'DIFC' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'DIFC');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Safa' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Al Safa');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Mirdif' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Mirdif');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Motor City' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Motor City');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Sports City' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Sports City');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Dubai Hills' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Dubai Hills');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Barsha' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Al Barsha');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Deira' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Deira');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Bur Dubai' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Bur Dubai');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Karama' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Karama');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Silicon Oasis' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Silicon Oasis');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'International City' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'International City');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Quoz' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Al Quoz');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Nahda' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Al Nahda');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Jumeirah' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Jumeirah');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Palm Jumeirah' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Palm Jumeirah');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Furjan' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Al Furjan');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Discovery Gardens' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Discovery Gardens');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Dubai South' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@dubaiId, 1, 'Dubai South');
END

-- Abu Dhabi areas
IF @abudhabiId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Yas Island' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Yas Island');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Saadiyat Island' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Saadiyat Island');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Reem Island' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Al Reem Island');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Khalidiyah' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Al Khalidiyah');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Corniche' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Corniche');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Nahyan' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Al Nahyan');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Mushrif' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Al Mushrif');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Bateen' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@abudhabiId, 1, 'Al Bateen');
END

-- Sharjah areas
IF @sharjahId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Majaz' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@sharjahId, 1, 'Al Majaz');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Nahda Sharjah' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@sharjahId, 1, 'Al Nahda Sharjah');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Al Qasimia' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@sharjahId, 1, 'Al Qasimia');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'Muwaileh' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@sharjahId, 1, 'Muwaileh');
    IF NOT EXISTS (SELECT 1 FROM Areas WHERE Name = 'University City' AND TenantId = 1)
        INSERT INTO Areas (CityId, TenantId, Name) VALUES (@sharjahId, 1, 'University City');
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_Countries_DefaultCountryId",
                table: "Tenants");

            migrationBuilder.DropTable(
                name: "TenantPaymentSettings");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_DefaultCountryId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ContactFirstName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ContactLastName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ContactMobilePhone",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ContactTitle",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "DefaultCityText",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "DefaultCountryId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LoginUrl",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "OfficialName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "StateProvince",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Street",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Tenants");
        }
    }
}
