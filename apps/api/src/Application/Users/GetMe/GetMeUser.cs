using Kijk.Application.Abstractions.Identity;
using Kijk.Application.Abstractions.Persistence;
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
    CurrentUser currentUser,
    ILogger<GetMeUserHandler> logger) : IHandler
{
    public async Task<Result<GetMeUserResponse>> GetMeAsync(CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .AsNoTracking()
            .AsSplitQuery()
            .ToResponse()
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            logger.LogError("User with id {Id} not found", currentUser.Id);
            return Error.NotFound("User not found");
        }

        var externalIdentity = await identityProvider.GetAsync(currentUser.AuthId, cancellationToken);
        var useExternalProfile = externalIdentity.UseProfileInKijk ?? false;
        var showProfilePreview = userEntity.FirstTime is true;

        return userEntity with
        {
            UseExternalProfile = useExternalProfile,
            ExternalIdentity = new(
                showProfilePreview || useExternalProfile ? externalIdentity.FullName : null,
                externalIdentity.Email,
                showProfilePreview || useExternalProfile ? externalIdentity.ImageUrl : null)
        };
    }
}