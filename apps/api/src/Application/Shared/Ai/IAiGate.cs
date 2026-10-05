namespace Kijk.Application.Shared.Ai;

/// <summary>
/// The single check every AI call passes first. The paywall of a later phase is added here.
/// </summary>
public interface IAiGate
{
    /// <summary>
    /// Returns whether AI may be used for the household by the user right now: the server-side switch is on, a
    /// provider is configured, the user is a member and has not turned AI off.
    /// </summary>
    /// <param name="householdId">The household the data belongs to.</param>
    /// <param name="userId">The user the call is made for.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns><see langword="true" /> if an AI call is allowed.</returns>
    Task<bool> CanUseAiAsync(Guid householdId, Guid userId, CancellationToken cancellationToken);
}