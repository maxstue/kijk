namespace Kijk.Application.Shared.Features;

/// <summary>
/// The remote switches that turn optional parts of Kijk on or off globally. The keys are in
/// <see cref="Kijk.Shared.AppConstants.Features" />.
/// </summary>
public interface IFeatureFlags
{
    /// <summary>
    /// Returns whether the part of Kijk is switched on globally. When the flag service is not configured or cannot
    /// be reached, the configured fallback applies, so an outage never takes the application away.
    /// </summary>
    /// <param name="feature">The feature key.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns><see langword="true" /> if the part is available globally.</returns>
    Task<bool> IsEnabledAsync(string feature, CancellationToken cancellationToken);
}