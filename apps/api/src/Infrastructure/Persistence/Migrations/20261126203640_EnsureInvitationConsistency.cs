using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnsureInvitationConsistency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_space_invitations_spaces_space_id",
                table: "space_invitations");

            migrationBuilder.AddColumn<string>(
                name: "email_fingerprint",
                table: "space_invitations",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_email_fingerprint_space_id",
                table: "space_invitations",
                columns: new[] { "email_fingerprint", "space_id" },
                unique: true,
                filter: "email_fingerprint IS NOT NULL AND accepted_at IS NULL AND declined_at IS NULL AND revoked_at IS NULL");

            migrationBuilder.AddForeignKey(
                name: "fk_space_invitations_spaces_space_id",
                table: "space_invitations",
                column: "space_id",
                principalTable: "spaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_space_invitations_spaces_space_id",
                table: "space_invitations");

            migrationBuilder.DropIndex(
                name: "ix_space_invitations_email_fingerprint_space_id",
                table: "space_invitations");

            migrationBuilder.DropColumn(
                name: "email_fingerprint",
                table: "space_invitations");

            migrationBuilder.AddForeignKey(
                name: "fk_space_invitations_spaces_space_id",
                table: "space_invitations",
                column: "space_id",
                principalTable: "spaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
