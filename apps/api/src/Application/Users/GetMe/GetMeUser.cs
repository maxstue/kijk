using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.GetMe;

/// <summary>
/// Handler for the getting the current user.
/// It returns more data for the current user.
/// </summary>
public class GetMeUserHandler(
  IAppDbContext dbContext,
  IIdentityProvider identityProvider,
  CurrentUser currentUser) : IHandler
{
    public async Task<Result<CurrentUserResponse>> GetMeAsync(CancellationToken cancellationToken)
    {
        var externalIdentity = await identityProvider.GetAsync(currentUser.AuthId, cancellationToken);
        var userEntity = await dbContext.Users
          .Where(x => x.AuthId == currentUser.AuthId)
          .AsNoTracking()
          .AsSplitQuery()
          .ToResponse()
          .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null || !userEntity.OnboardingCompleted)
        {
            return CurrentUserResponse.OnboardingRequired(new(externalIdentity.FullName, externalIdentity.Email, externalIdentity.ImageUrl));
        }

        var useExternalProfile = externalIdentity.UseProfileInKijk ?? false;
        var user = userEntity with
        {
            UseExternalProfile = useExternalProfile,
            ExternalIdentity = new(
            useExternalProfile ? externalIdentity.FullName : null,
            externalIdentity.Email,
            useExternalProfile ? externalIdentity.ImageUrl : null)
        };

        return CurrentUserResponse.Ready(user, user.ExternalIdentity);
    }
}