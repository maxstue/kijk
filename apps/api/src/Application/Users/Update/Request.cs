using Kijk.Shared;

namespace Kijk.Application.Users.Update;

public record UpdateUserRequest(
    string? UserName,
    bool? UseDefaultResources,
    bool? UseExternalProfile,
    string? HouseholdName,
    AnalyticsConsent? AnalyticsConsent);