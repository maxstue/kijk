using System.Security.Claims;

using Microsoft.AspNetCore.Authentication;

using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

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
        private readonly AppDbContext _dbContext;

        public ClaimsTransformation(CurrentUser currentUser, AppDbContext dbContext)
        {
            _currentUser = currentUser;
            _dbContext = dbContext;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = principal.FindFirstValue(ClaimTypes.Email);

            var userEntity = await _dbContext.Users
                .AsNoTracking()
                .Where(x => x.AuthId == sub)
                .FirstOrDefaultAsync();

            // We're not going to transform anything. We're using this as a hook into authorization
            // to set the current user without adding custom middleware.
            _currentUser.Principal = principal;
            _currentUser.User = userEntity ?? User.Create(
                sub,
                AppConstants.CreateUserIdentifier,
                email,
                firstTime: true);

            return await Task.FromResult(principal);
        }
    }
}
