using Kijk.Application.Abstractions.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.GetMe;

/// <summary>
/// Handler for the getting the current user.
/// It returns more data for the current user.
/// </summary>
public class GetMeUserHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<GetMeUserHandler> logger) : IHandler
{
    public async Task<Result<GetMeUserResponse>> GetMeAsync(CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .AsNoTracking()
            .AsSplitQuery()
            .ProjectToResponse()
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            logger.LogError("User with id {Id} not found", currentUser.Id);
            return Error.NotFound("User not found");
        }

        return userEntity;
    }
}