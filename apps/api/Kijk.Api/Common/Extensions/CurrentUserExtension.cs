using System.Security.Claims;

using Microsoft.AspNetCore.Authentication;

using Kijk.Api.Common.Models;

namespace Kijk.Api.Common.Extensions;

public static class CurrentUserExtensions
{
    public static IServiceCollection AddCurrentUser(this IServiceCollection services)
    {
        services.AddScoped<CurrentUser>();
        services.AddScoped<IClaimsTransformation, ClaimsTransformation>();
        return services;
    }

    /// <summary>
    ///     This class gets only called if <see cref="ClaimsPrincipal" /> is NOT null.
    /// </summary>
    private sealed class ClaimsTransformation : IClaimsTransformation
    {
        private readonly CurrentUser _currentUser;

        public ClaimsTransformation(CurrentUser currentUser)
        {
            _currentUser = currentUser;
        }

        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            // We're not going to transform anything. We're using this as a hook into authorization
            // to set the current user without adding custom middleware.
            _currentUser.Principal = principal;

            return Task.FromResult(principal);
        }
    }
}
