using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Users.Guide;

/// <summary>Reads and updates only the authenticated user's optional guide.</summary>
public sealed class GuideHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>The single content version shared by the product guide and tour.</summary>
    public const int Version = 1;

    private static readonly string[] StepIds = ["dashboard", "consumptions", "resources", "limits", "finances", "navigation"];

    /// <summary>Loads the authenticated user's progress without inferring it from a period filter.</summary>
    public async Task<Result<GuideResponse>> ReadAsync(CancellationToken cancellationToken)
    {
        var response = await dbContext.Users.AsNoTracking().Where(user => user.Id == currentUser.Id)
            .ToGuideResponse().SingleOrDefaultAsync(cancellationToken);
        return response is null ? Error.NotFound("User not found") : response;
    }

    /// <summary>Applies a partial preference change; completed explanations cannot be reset.</summary>
    public async Task<Result<GuideResponse>> UpdateAsync(UpdateGuideRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(user => user.Id == currentUser.Id, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("User not found");
        }

        if (request.CompletedStep is { } step && !StepIds.Contains(step, StringComparer.Ordinal))
        {
            return Error.Validation("Unknown guide step");
        }
        if (request.Hidden is { } hidden)
        {
            user.SetGuideHidden(hidden);
        }
        if (request.CompletedStep is { } completedStep)
        {
            user.CompleteGuideStep(Version, completedStep);
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        return user.ToGuideResponse();
    }
}