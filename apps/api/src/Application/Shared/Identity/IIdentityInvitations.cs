namespace Kijk.Application.Shared.Identity;

/// <summary>
/// Looks up identities by e-mail and manages the authentication provider's invitations, which deliver Kijk invitations
/// to people without an account. Full e-mail addresses go only to the provider.
/// </summary>
public interface IIdentityInvitations
{
    /// <summary>Finds the identity that owns a verified e-mail address.</summary>
    /// <param name="email">The e-mail address.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The identity's id, or <see langword="null" /> when no identity has verified this address.</returns>
    Task<string?> FindByVerifiedEmailAsync(string email, CancellationToken cancellationToken);

    /// <summary>
    /// Sends the provider's invitation e-mail to a person without an account. Signing up through it stores the Kijk
    /// invitation id in the new identity.
    /// </summary>
    /// <param name="email">The e-mail address.</param>
    /// <param name="invitationId">The Kijk invitation.</param>
    /// <param name="lifetime">How long the provider invitation stays valid.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The provider's invitation id.</returns>
    Task<string> InviteAsync(string email, Guid invitationId, TimeSpan lifetime, CancellationToken cancellationToken);

    /// <summary>
    /// Permanently deletes a provider invitation together with the e-mail address it holds. An invitation that no
    /// longer exists counts as deleted.
    /// </summary>
    /// <param name="providerInvitationId">The provider's invitation id.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the invitation is gone.</returns>
    Task DeleteInvitationAsync(string providerInvitationId, CancellationToken cancellationToken);

    /// <summary>Removes the Kijk invitation id from an identity once Kijk has linked it.</summary>
    /// <param name="authId">The identity's id.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the id is removed.</returns>
    Task ClearInvitationIdAsync(string authId, CancellationToken cancellationToken);
}