namespace Kijk.Shared;

public static class AppConstants
{
    /// <summary>
    /// Defines the Roles used and allowed in the app.
    /// </summary>
    public static class Roles
    {
        public const string All = "All";
        public const string Admin = "Admin";
        public const string User = "User";
    }

    /// <summary>
    /// Defines authorization policies used by the app.
    /// </summary>
    public static class Policies
    {
        public const string OnboardingCompleted = "OnboardingCompleted";
    }

    public const string CorrelationId = "X-Correlation-Id";

    public const string RateLimit = "PerUserRatelimit";
    public const string Cors = "CorsPolicy";

    public static class Colors
    {
        public const string Default = "#89CEA4";
    }
}
