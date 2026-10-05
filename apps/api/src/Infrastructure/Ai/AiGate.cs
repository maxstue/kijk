using Kijk.Application.Shared.Ai;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Ai;

/// <summary>
/// Allows AI calls only when the kill switch is on and an API key is configured. Phase 4 adds the user's AI switch and
/// Phase 8 the paywall to this single check.
/// </summary>
/// <param name="ai">The AI settings.</param>
internal sealed class AiGate(IOptionsMonitor<AiOptions> ai) : IAiGate
{
    /// <inheritdoc />
    public Task<bool> CanUseAiAsync(Guid householdId, CancellationToken cancellationToken) =>
        Task.FromResult(ai.CurrentValue.Enabled && !string.IsNullOrWhiteSpace(ai.CurrentValue.ApiKey));
}