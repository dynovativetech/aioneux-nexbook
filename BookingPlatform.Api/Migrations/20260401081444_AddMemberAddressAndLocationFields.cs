using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberAddressAndLocationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Address",
                table: "Users",
                newName: "StreetAddress");

            migrationBuilder.AddColumn<string>(
                name: "ApartmentOrVillaNumber",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AreaId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CommunityId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Emirate",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LandlinePhone",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_AreaId",
                table: "Users",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_CommunityId",
                table: "Users",
                column: "CommunityId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Areas_AreaId",
                table: "Users",
                column: "AreaId",
                principalTable: "Areas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Communities_CommunityId",
                table: "Users",
                column: "CommunityId",
                principalTable: "Communities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Areas_AreaId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Communities_CommunityId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_AreaId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_CommunityId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ApartmentOrVillaNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AreaId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CommunityId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Emirate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LandlinePhone",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "StreetAddress",
                table: "Users",
                newName: "Address");
        }
    }
}
