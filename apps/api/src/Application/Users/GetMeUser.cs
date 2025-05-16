using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using GetMeUserResponse = Kijk.Application.Users.Shared.GetMeUserResponse;
using UserHouseholdResponse = Kijk.Application.Users.Shared.UserHouseholdResponse;
using UserResourceResponse = Kijk.Application.Users.Shared.UserResourceResponse;

namespace Kijk.Application.Users;

/// <summary>
/// Handler for the getting the current user.
/// It returns more data for the current user.
/// </summary>
public static class GetMeUserHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetMeUserHandler));
    public static async Task<Results<Ok<GetMeUserResponse>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
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
            Logger.Error("User with id {Id} not found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound("User not found").ToProblemDetails());
        }

        var response = new GetMeUserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userEntity.UserHouseholds.Select(UserHouseholdResponse.Create),
            userEntity.Resources.Select(c => new UserResourceResponse(c.Id, c.Name, c.Unit, c.Color, c.CreatorType)));
        return TypedResults.Ok(response);
    }
}