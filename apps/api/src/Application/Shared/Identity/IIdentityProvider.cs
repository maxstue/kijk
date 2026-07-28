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
}