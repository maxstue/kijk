using Kijk.Application.Shared.Features;
using Kijk.Shared;

namespace Kijk.Application.Users.Features;

/// <summary>
/// The parts of Kijk that are switched on for the current user. The client hides what is off; the API enforces the
/// same decisions, so both always agree.
/// </summary>
/// <param name="Finances">Whether the finance area (accounts, transactions, budgets, categories, imports) is available.</param>
/// <param name="AiImport">
/// Whether the AI assistance of the bank import is available. It lives inside the finance area and is off whenever that is.
/// The server-side AI kill switch and the member's own AI setting apply in addition.
/// </param>
public sealed record FeaturesResponse(bool Finances, bool AiImport);

/// <summary>Evaluates the feature flags for the current user.</summary>
public sealed class FeaturesHandler(IFeatureFlags featureFlags)
{
    /// <summary>Gets the parts of Kijk that are switched on for the current user.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The switched-on parts.</returns>
    public async Task<FeaturesResponse> HandleAsync(CancellationToken cancellationToken)
    {
        var finances = await featureFlags.IsEnabledAsync(AppConstants.Features.Finances, cancellationToken);
        var aiImport = finances && await featureFlags.IsEnabledAsync(AppConstants.Features.AiImport, cancellationToken);
        return new(finances, aiImport);
    }
}