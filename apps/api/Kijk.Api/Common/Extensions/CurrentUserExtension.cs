using System.Security.Claims;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Authentication;

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
    private sealed class ClaimsTransformation(CurrentUser currentUser, AppDbContext dbContext) : IClaimsTransformation
    {
        // We're not going to transform anything. We're using this as a hook into authorization
        // to set the current user without adding custom middleware.
        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier);

            if (sub != null)
            {
                var email = principal.FindFirstValue(ClaimTypes.Email);
                var userEntity = await dbContext.Users
                    .AsNoTracking()
                    .Where(x => x.AuthId == sub)
                    .Select(x => SimpleAuthUser.Create(x))
                    .FirstOrDefaultAsync();

                currentUser.Principal = principal;
                // TODO use more values from token
                currentUser.User = userEntity ?? new SimpleAuthUser(
                    Guid.NewGuid(),
                    sub,
                    AppConstants.CreateUserIdentifier,
                    email,
                    true);
            }

            return await Task.FromResult(principal);
        }
    }
}
