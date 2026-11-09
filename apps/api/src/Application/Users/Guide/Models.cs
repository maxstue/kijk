namespace Kijk.Application.Users.Guide;

/// <summary>User-owned product introduction progress, independent of welcome setup and analytics.</summary>
/// <param name="GuideHidden">Whether the dashboard checklist is hidden.</param>
/// <param name="GuideCompletedVersion">The common guide version associated with the completed steps.</param>
/// <param name="GuideCompletedSteps">Completed subtour ids for the associated guide version.</param>
/// <param name="GuideFirstConsumptionAt">The first consumption successfully recorded by this user.</param>
public sealed record GuideResponse(bool GuideHidden, int GuideCompletedVersion, string[] GuideCompletedSteps, DateTime? GuideFirstConsumptionAt)
{
    /// <summary>The current version of the entire product guide and tour.</summary>
    public int GuideVersion { get; init; } = GuideHandler.Version;
}

/// <summary>A partial change to the optional introduction. Consumption progress is recorded only by the API.</summary>
/// <param name="Hidden">Whether to hide the checklist; null keeps the preference.</param>
/// <param name="CompletedStep">A completed subtour: dashboard, consumptions, resources, limits, finances or navigation. Null keeps progress.</param>
public sealed record UpdateGuideRequest(bool? Hidden, string? CompletedStep);