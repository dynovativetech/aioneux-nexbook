using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVenueManagementEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactPersonEmail",
                table: "Venues",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonName",
                table: "Venues",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonPhone",
                table: "Venues",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "Venues",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Venues",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleMapsUrl",
                table: "Venues",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Venues",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Mobile",
                table: "Venues",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Venues",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "Venues",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Venues",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Body",
                table: "NotificationLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "NotificationLogs",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EventType",
                table: "NotificationLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RecipientRole",
                table: "NotificationLogs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SentAt",
                table: "NotificationLogs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxConsecutiveSlots",
                table: "Facilities",
                type: "int",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "SlotDurationMinutes",
                table: "Facilities",
                type: "int",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.CreateTable(
                name: "FacilityActivities",
                columns: table => new
                {
                    FacilityId = table.Column<int>(type: "int", nullable: false),
                    ActivityId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FacilityActivities", x => new { x.FacilityId, x.ActivityId });
                    table.ForeignKey(
                        name: "FK_FacilityActivities_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FacilityActivities_Facilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "Facilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FacilityOperatingHours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FacilityId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    OpenTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    CloseTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    IsClosed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FacilityOperatingHours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FacilityOperatingHours_Facilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "Facilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TenantEmailSettings",
                columns: table => new
                {
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    Provider = table.Column<int>(type: "int", nullable: false),
                    SmtpHost = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    SmtpPort = table.Column<int>(type: "int", nullable: true),
                    SmtpUsername = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: true),
                    SmtpPasswordEncrypted = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SmtpUseSsl = table.Column<bool>(type: "bit", nullable: false),
                    ApiKeyEncrypted = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FromEmail = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    FromName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ReplyToEmail = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantEmailSettings", x => x.TenantId);
                    table.ForeignKey(
                        name: "FK_TenantEmailSettings_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TenantNotificationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    EventType = table.Column<int>(type: "int", nullable: false),
                    NotifyCustomer = table.Column<bool>(type: "bit", nullable: false),
                    NotifyOrganizer = table.Column<bool>(type: "bit", nullable: false),
                    NotifyTenantAdmin = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantNotificationSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantNotificationSettings_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VenueAmenities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VenueId = table.Column<int>(type: "int", nullable: false),
                    AmenityType = table.Column<int>(type: "int", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VenueAmenities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VenueAmenities_Venues_VenueId",
                        column: x => x.VenueId,
                        principalTable: "Venues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VenueImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VenueId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    Caption = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VenueImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VenueImages_Venues_VenueId",
                        column: x => x.VenueId,
                        principalTable: "Venues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VenueOperatingHours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VenueId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    OpenTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    CloseTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    IsClosed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VenueOperatingHours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VenueOperatingHours_Venues_VenueId",
                        column: x => x.VenueId,
                        principalTable: "Venues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VenueOrganizers",
                columns: table => new
                {
                    VenueId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: true),
                    OfficialEmail = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Mobile = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Website = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VenueOrganizers", x => new { x.VenueId, x.UserId });
                    table.ForeignKey(
                        name: "FK_VenueOrganizers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VenueOrganizers_Venues_VenueId",
                        column: x => x.VenueId,
                        principalTable: "Venues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_EventType",
                table: "NotificationLogs",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_FacilityActivities_ActivityId",
                table: "FacilityActivities",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_FacilityOperatingHours_FacilityId_DayOfWeek",
                table: "FacilityOperatingHours",
                columns: new[] { "FacilityId", "DayOfWeek" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TenantNotificationSettings_TenantId",
                table: "TenantNotificationSettings",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantNotificationSettings_TenantId_EventType",
                table: "TenantNotificationSettings",
                columns: new[] { "TenantId", "EventType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VenueAmenities_VenueId_AmenityType",
                table: "VenueAmenities",
                columns: new[] { "VenueId", "AmenityType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VenueImages_VenueId",
                table: "VenueImages",
                column: "VenueId");

            migrationBuilder.CreateIndex(
                name: "IX_VenueOperatingHours_VenueId_DayOfWeek",
                table: "VenueOperatingHours",
                columns: new[] { "VenueId", "DayOfWeek" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VenueOrganizers_UserId",
                table: "VenueOrganizers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FacilityActivities");

            migrationBuilder.DropTable(
                name: "FacilityOperatingHours");

            migrationBuilder.DropTable(
                name: "TenantEmailSettings");

            migrationBuilder.DropTable(
                name: "TenantNotificationSettings");

            migrationBuilder.DropTable(
                name: "VenueAmenities");

            migrationBuilder.DropTable(
                name: "VenueImages");

            migrationBuilder.DropTable(
                name: "VenueOperatingHours");

            migrationBuilder.DropTable(
                name: "VenueOrganizers");

            migrationBuilder.DropIndex(
                name: "IX_NotificationLogs_EventType",
                table: "NotificationLogs");

            migrationBuilder.DropColumn(
                name: "ContactPersonEmail",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "ContactPersonName",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "ContactPersonPhone",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "GoogleMapsUrl",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "Mobile",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "Body",
                table: "NotificationLogs");

            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "NotificationLogs");

            migrationBuilder.DropColumn(
                name: "EventType",
                table: "NotificationLogs");

            migrationBuilder.DropColumn(
                name: "RecipientRole",
                table: "NotificationLogs");

            migrationBuilder.DropColumn(
                name: "SentAt",
                table: "NotificationLogs");

            migrationBuilder.DropColumn(
                name: "MaxConsecutiveSlots",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "SlotDurationMinutes",
                table: "Facilities");
        }
    }
}
