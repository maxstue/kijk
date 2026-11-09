namespace Kijk.Application.Users.Guide;

/// <summary>User-owned product introduction progress, independent of welcome setup and analytics.</summary>
/// <param name="GuideHidden">Whether the dashboard checklist is hidden.</param>
/// <param name="GuideDashboardVersion">The latest completed dashboard explanation.</param>
/// <param name="GuideFirstConsumptionAt">The first consumption successfully recorded by this user.</param>
public sealed record GuideResponse(bool GuideHidden, int GuideDashboardVersion, DateTime? GuideFirstConsumptionAt);

/// <summary>A partial change to the optional introduction. Consumption progress is recorded only by the API.</summary>
/// <param name="Hidden">Whether to hide the checklist; null keeps the preference.</param>
/// <param name="DashboardExplained">True records completion of the current explanation; null keeps progress.</param>
public sealed record UpdateGuideRequest(bool? Hidden, bool? DashboardExplained);