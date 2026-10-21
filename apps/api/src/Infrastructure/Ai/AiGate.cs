using Kijk.Application.Shared.Ai;
using Kijk.Application.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Ai;

/// <summary>
/// Allows AI calls only when the kill switch is on, an API key is configured and the member has not turned AI off.
/// Phase 8 adds the paywall to this single check.
/// </summary>
/// <param name="ai">The AI settings.</param>
/// <param name="dbContext">The database context.</param>
internal sealed class AiGate(IOptionsMonitor<AiOptions> ai, IAppDbContext dbContext) : IAiGate
{
    /// <inheritdoc />
    public async Task<bool> CanUseAiAsync(Guid spaceId, Guid userId, CancellationToken cancellationToken) =>
        ai.CurrentValue.Enabled
        && !string.IsNullOrWhiteSpace(ai.CurrentValue.ApiKey)
        && await dbContext.UserSpaces.AnyAsync(
            link => link.UserId == userId && link.SpaceId == spaceId && link.User.AiEnabled,
            cancellationToken);
}