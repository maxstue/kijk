namespace Kijk.Api.Common.Models;

public static class AppConstants
{

    /// <summary>
    ///     Defines the Roles used and allowed in the app.
    /// </summary>
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string User = "User";

        public static readonly string[] All = { User, Admin };
    }

    /// <summary>
    ///     Defines the Policies used in the app.
    /// </summary>
    public static class Policies
    {
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

    public static class CacheNames
    {
        public const string Base = "Base";
    }
}
