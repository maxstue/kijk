namespace Kijk.Application.Users.Guide;

/// <summary>User-owned tour progress, independent of welcome setup and analytics.</summary>
/// <param name="GuideCompletedVersion">The common guide version associated with the completed steps.</param>
/// <param name="GuideCompletedSteps">Completed subtour ids for the associated guide version.</param>
/// <param name="GuideCompletedAt">When the introduction was last completed or skipped (UTC); null until completion.</param>
public sealed record GuideResponse(int GuideCompletedVersion, string[] GuideCompletedSteps, DateTime? GuideCompletedAt)
{
    /// <summary>The current version of the entire product guide and tour.</summary>
    public int GuideVersion { get; init; } = GuideHandler.Version;
}

/// <summary>Records a completed subtour, full tour or a skipped introduction.</summary>
/// <param name="CompletedStep">A completed subtour: dashboard, consumptions, resources, limits, finances or navigation. Null with CompletedTour skips the introduction.</param>
/// <param name="CompletedTour">Whether the introduction is completed or skipped; the API records its timestamp.</param>
public sealed record UpdateGuideRequest(string? CompletedStep = null, bool CompletedTour = false);