using Kijk.Application.Users.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users;

public record UpdateUserRequest(string? UserName, bool? UseDefaultResources);

/// <summary>
/// Handler for updating a user.
/// </summary>
public class UpdateUserHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<UpdateUserHandler> logger) : IHandler
{
    public async Task<Result<UserResponse>> UpdateAsync(UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .Include(x => x.Resources)
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            logger.LogError("User with id {Id} not found", currentUser.Id);
            return Error.NotFound("User not found");
        }

        if (request.UserName is null)
        {
            logger.LogError("User name is null");
            return Error.Unexpected("User name is null");
        }

        userEntity.FirstTime = false;
        userEntity.Name = request.UserName;

        if (request.UseDefaultResources is true && userEntity.Resources.Any(x => x.CreatorType != CreatorType.System))
        {
            var defaultTypes = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            userEntity.SetDefaultResources(true, defaultTypes);
        }
        else if (request.UseDefaultResources is false &&
                 userEntity.Resources.Any(x => x.CreatorType == CreatorType.System))
        {
            var defaultTypes = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            userEntity.SetDefaultResources(false, defaultTypes);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return new UserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userEntity.Resources.Any(c => c.CreatorType == CreatorType.System));
    }
}