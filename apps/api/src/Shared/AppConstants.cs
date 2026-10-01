namespace Kijk.Shared;

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

    public const string CorrelationId = "X-Correlation-Id";

    public const string RateLimit = "PerUserRatelimit";
    public const string Cors = "CorsPolicy";

    public static class Colors
    {
        public const string Default = "#89CEA4";
    }
}