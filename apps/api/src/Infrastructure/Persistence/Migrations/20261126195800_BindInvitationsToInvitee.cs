using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BindInvitationsToInvitee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Link invitations are bound to nobody and can no longer be accepted.
            migrationBuilder.Sql("DELETE FROM space_invitations;");

            migrationBuilder.DropIndex(
                name: "ix_space_invitations_token_hash",
                table: "space_invitations");

            migrationBuilder.DropColumn(
                name: "token_hash",
                table: "space_invitations");

            migrationBuilder.AddColumn<DateTime>(
                name: "declined_at",
                table: "space_invitations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invitee_auth_id",
                table: "space_invitations",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invitee_label",
                table: "space_invitations",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "provider_invitation_id",
                table: "space_invitations",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_invitee_auth_id",
                table: "space_invitations",
                column: "invitee_auth_id");

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_space_id_invitee_auth_id",
                table: "space_invitations",
                columns: new[] { "space_id", "invitee_auth_id" },
                unique: true,
                filter: "invitee_auth_id IS NOT NULL AND accepted_at IS NULL AND declined_at IS NULL AND revoked_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Invitations bound to a person have no token to restore.
            migrationBuilder.Sql("DELETE FROM space_invitations;");

            migrationBuilder.DropIndex(
                name: "ix_space_invitations_invitee_auth_id",
                table: "space_invitations");

            migrationBuilder.DropIndex(
                name: "ix_space_invitations_space_id_invitee_auth_id",
                table: "space_invitations");

            migrationBuilder.DropColumn(
                name: "declined_at",
                table: "space_invitations");

            migrationBuilder.DropColumn(
                name: "invitee_auth_id",
                table: "space_invitations");

            migrationBuilder.DropColumn(
                name: "invitee_label",
                table: "space_invitations");

            migrationBuilder.DropColumn(
                name: "provider_invitation_id",
                table: "space_invitations");

            migrationBuilder.AddColumn<byte[]>(
                name: "token_hash",
                table: "space_invitations",
                type: "bytea",
                maxLength: 32,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_token_hash",
                table: "space_invitations",
                column: "token_hash",
                unique: true);
        }
    }
}
