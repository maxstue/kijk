using Kijk.Application.Shared.Persistence;
using Npgsql;

namespace Kijk.Application.Spaces.Shared;

/// <summary>Links an open invitation while preserving at most one open invitation per recipient and space.</summary>
internal static class SpaceInvitationRecipient
{
    private const string RecipientIndex = "ix_space_invitations_space_id_invitee_auth_id";
    private const string Savepoint = "link_invitation_recipient";

    public static async Task LinkAsync(
        IAppDbContext dbContext, Guid invitationId, Guid spaceId, string authId, DateTime utcNow, CancellationToken cancellationToken)
    {
        var existing = dbContext.SpaceInvitations.Where(item => item.SpaceId == spaceId && item.InviteeAuthId == authId);
        await existing.CloseExpiredAsync(utcNow, cancellationToken);
        if (await existing.Unclosed().AnyAsync(cancellationToken))
        {
            return;
        }

        var transaction = dbContext.Database.CurrentTransaction
            ?? throw new InvalidOperationException("Linking an invitation requires a transaction.");
        await transaction.CreateSavepointAsync(Savepoint, cancellationToken);
        try
        {
            await dbContext.SpaceInvitations
                .Where(item => item.Id == invitationId && item.InviteeAuthId == null)
                .Pending(utcNow)
                .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.InviteeAuthId, authId), cancellationToken);
        }
        catch (Exception error) when (IsRecipientConflict(error) || IsRecipientConflict(error.InnerException))
        {
            // The other invitation won. Roll back only this write so onboarding or the submission can still commit.
            await transaction.RollbackToSavepointAsync(Savepoint, cancellationToken);
        }

        await transaction.ReleaseSavepointAsync(Savepoint, cancellationToken);
    }

    private static bool IsRecipientConflict(Exception? error) =>
        error is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: RecipientIndex };
}