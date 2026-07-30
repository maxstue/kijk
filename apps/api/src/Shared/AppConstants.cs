namespace Kijk.Shared;

public static class AppConstants
{
    public const string CreateUserIdentifier = "CREATE_USER";

    /// <summary>
    /// Defines the Roles used and allowed in the app.
    /// </summary>
    public static class Roles
    {
        public const string All = "All";
        public const string Admin = "Admin";
        public const string User = "User";
    }

    public const string CorrelationId = "X-Correlation-Id";

    public const string RateLimit = "PerUserRatelimit";
    public const string Cors = "CorsPolicy";

    public static class Colors
    {
        public const string Default = "#89CEA4";
    }
}