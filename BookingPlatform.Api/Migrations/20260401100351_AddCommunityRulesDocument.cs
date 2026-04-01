using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityRulesDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityRulesDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    AreaId = table.Column<int>(type: "int", nullable: true),
                    CommunityId = table.Column<int>(type: "int", nullable: true),
                    Html = table.Column<string>(type: "nvarchar(max)", maxLength: 30000, nullable: false),
                    UpdatedByUserId = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityRulesDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityRulesDocuments_Areas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "Areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityRulesDocuments_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityRulesDocuments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityRulesDocuments_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityRulesDocuments_AreaId",
                table: "CommunityRulesDocuments",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityRulesDocuments_CommunityId",
                table: "CommunityRulesDocuments",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityRulesDocuments_TenantId",
                table: "CommunityRulesDocuments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityRulesDocuments_UpdatedByUserId",
                table: "CommunityRulesDocuments",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityRulesDocuments");
        }
    }
}
