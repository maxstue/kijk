using Kijk.Application.Users.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Users;

public record UpdateUserRequest(string? UserName, bool? UseDefaultResources);

/// <summary>
/// Handler for updating a user.
/// </summary>
public static class UpdateUserHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateUserHandler));

    public static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> HandleAsync(UpdateUserRequest command, AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .Include(x => x.Resources)
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            Logger.Error("User with id {Id} not found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound("User not found").ToProblemDetails());
        }

        if (command.UserName is null)
        {
            Logger.Error("User name is null");
            return TypedResults.Problem(Error.Unexpected("User name is null").ToProblemDetails());
        }

        userEntity.FirstTime = false;
        userEntity.Name = command.UserName;

        if (command.UseDefaultResources is true && userEntity.Resources.Any(x => x.CreatorType != CreatorType.System))
        {
            var defaultTypes = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            userEntity.SetDefaultResources(true, defaultTypes);
        }
        else if (command.UseDefaultResources is false &&
                 userEntity.Resources.Any(x => x.CreatorType == CreatorType.System))
        {
            var defaultTypes = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            userEntity.SetDefaultResources(false, defaultTypes);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new UserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userEntity.Resources.Any(c => c.CreatorType == CreatorType.System));

        return TypedResults.Ok(response);
    }
}