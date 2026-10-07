namespace Kijk.Application.Shared.Identity;

/// <summary>
/// Provides access to identity data owned by the authentication provider.
/// </summary>
public interface IIdentityProvider
{
    /// <summary>
    /// Gets the external identity associated with the given authentication identifier.
    /// </summary>
    /// <param name="authId">The authentication provider's user identifier.</param>
    /// <param name="cancellationToken">A token that cancels waiting for the provider response.</param>
    /// <returns>The external identity.</returns>
    Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken);

    /// <summary>
    /// Sets whether Kijk may use the external full name and profile image.
    /// </summary>
    /// <param name="authId">The authentication provider's user identifier.</param>
    /// <param name="useProfileInKijk">Whether the optional profile data may be used.</param>
    /// <param name="cancellationToken">A token that cancels waiting for the provider response.</param>
    Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken);

    /// <summary>Deletes the identity at the authentication provider. An identity that no longer exists counts as deleted.</summary>
    /// <param name="authId">The authentication provider's user id.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the identity is gone.</returns>
    Task DeleteAsync(string authId, CancellationToken cancellationToken);
}