namespace Kijk.Shared;

/// <summary>Application-wide constant names.</summary>
public static class AppConstants
{
    /// <summary>
    /// Defines authorization policies used by the app.
    /// </summary>
    public static class Policies
    {
        /// <summary>Requires an authenticated identity.</summary>
        public const string Authenticated = "Authenticated";

        /// <summary>Requires a user who completed onboarding.</summary>
        public const string OnboardingCompleted = "OnboardingCompleted";

        private const string HouseholdPermissionPrefix = "HouseholdPermission:";

        /// <summary>
        /// Gets the name of the policy that requires a permission in the user's active household.
        /// </summary>
        /// <param name="permission">The permission name.</param>
        /// <returns>The policy name.</returns>
        public static string HouseholdPermission(string permission) => HouseholdPermissionPrefix + permission;

        /// <summary>
        /// Determines whether a policy name requires a household permission.
        /// </summary>
        /// <param name="policy">The policy name.</param>
        /// <returns><see langword="true"/> for household-permission policies.</returns>
        public static bool IsHouseholdPermission(string? policy) =>
            policy?.StartsWith(HouseholdPermissionPrefix, StringComparison.Ordinal) is true;
    }

    /// <summary>The response header carrying the request correlation id.</summary>
    public const string CorrelationId = "X-Correlation-Id";

    /// <summary>The name of the per-user rate limit policy.</summary>
    public const string RateLimit = "PerUserRatelimit";

    /// <summary>The name of the per-user rate limit for file uploads.</summary>
    public const string UploadRateLimit = "PerUserUploadRatelimit";
    /// <summary>The name of the CORS policy.</summary>
    public const string Cors = "CorsPolicy";

    /// <summary>Default colors.</summary>
    public static class Colors
    {
        /// <summary>The default color for new resources.</summary>
        public const string Default = "#89CEA4";
    }
}