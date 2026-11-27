using Kijk.Application.Shared.Identity;
using Kijk.Application.Spaces.Shared;
using Kijk.Application.Users.CompleteOnboarding;

namespace Kijk.Infrastructure.Spaces;

/// <summary>Performs invitation-related provider changes after their local transactions commit.</summary>
public static class InvitationMessageHandler
{
    /// <summary>Removes the metadata used during onboarding.</summary>
    public static Task Handle(ClearInvitationMetadata message, IIdentityInvitations identity, CancellationToken cancellationToken) =>
        identity.ClearInvitationIdAsync(message.AuthId, cancellationToken);

    /// <summary>Erases provider invitations whose local space or account has been deleted.</summary>
    public static async Task Handle(DeleteProviderInvitations message, IIdentityInvitations identity, CancellationToken cancellationToken)
    {
        HttpRequestException? failure = null;
        foreach (var id in message.ProviderIds)
        {
            try
            {
                await identity.DeleteInvitationAsync(id, cancellationToken);
            }
            catch (HttpRequestException error)
            {
                failure ??= error;
            }
        }

        if (failure is not null)
        {
            throw new HttpRequestException("Some provider invitations could not be deleted.", failure, failure.StatusCode);
        }
    }
}