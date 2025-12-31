using Kijk.Application.Users.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users;

/// <summary>
/// Handler for the getting the current user.
/// It returns more data for the current user.
/// </summary>
public class GetMeUserHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<GetMeUserHandler> logger) : IHandler
{
    public async Task<Result<GetMeUserResponse>> GetMeAsync(CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Include(x => x.UserHouseholds)
            .ThenInclude(x => x.Household)
            .Include(x => x.UserHouseholds)
            .ThenInclude(x => x.Role)
            .ThenInclude(x => x.Permissions)
            .Where(x => x.Id == currentUser.Id)
            .AsNoTracking()
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            logger.LogError("User with id {Id} not found", currentUser.Id);
            return Error.NotFound("User not found");
        }

        return new GetMeUserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userEntity.UserHouseholds.Select(UserHouseholdResponse.Create),
            userEntity.Resources.Select(c => new UserResourceResponse(c.Id, c.Name, c.Unit, c.Color, c.CreatorType)));
    }
}