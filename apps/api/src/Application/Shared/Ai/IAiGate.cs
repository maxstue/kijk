namespace Kijk.Application.Shared.Ai;

/// <summary>
/// The single check every AI call passes first. Later phases add the user's AI switch and the paywall here.
/// </summary>
public interface IAiGate
{
    /// <summary>Returns whether AI may be used for the household right now.</summary>
    /// <param name="householdId">The household the data belongs to.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns><see langword="true" /> if an AI call is allowed.</returns>
    Task<bool> CanUseAiAsync(Guid householdId, CancellationToken cancellationToken);
}