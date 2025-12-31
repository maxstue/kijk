namespace Kijk.Shared;

public static class AppConstants
{
    /// <summary>
    /// These paths are allowed to be accessed without validating the current user.
    /// It is only used in "CurrentUserMiddleware" to determine if the current user should be set.
    /// </summary>
    public static readonly string[] AllowedOpenApiPaths = ["openapi", "scalar", "favicon"];

    public const string CreateUserIdentifier = "CREATE_USER";

    /// <summary>
    ///     Defines the Roles used and allowed in the app.
    /// </summary>
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string User = "User";

        public static readonly string[] All = [User, Admin];
    }

    /// <summary>
    ///     Defines the Policies used in the app.
    /// </summary>
    public static class Policies
    {
        public const string CorrelationId = "X-Correlation-Id";
        public const string User = "User";
        public const string Admin = "Admin";
        public const string All = "All";

        public const string RateLimit = "PerUserRatelimit";
        public const string Cors = "CorsPolicy";
    }

    public static class Colors
    {
        public const string Default = "#89CEA4";
    }
}