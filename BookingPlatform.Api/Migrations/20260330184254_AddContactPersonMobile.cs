using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddContactPersonMobile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "Venues");

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonMobile",
                table: "Venues",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactPersonMobile",
                table: "Venues");

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "Venues",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: true);
        }
    }
}
