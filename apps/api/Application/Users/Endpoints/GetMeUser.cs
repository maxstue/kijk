using Kijk.Application.Users.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Users.Endpoints;

public static class GetMeUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetMeUser));

    /// <summary>
    /// Gets the current user with all related data.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    public static async Task<Results<Ok<GetMeUserResponse>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Include(x => x.Accounts)
            .ThenInclude(x => x.Transactions)
            .Include(x => x.Categories)
            .Include(x => x.Budgets)
            .Include(x => x.UserHouseholds)
            .ThenInclude(x => x.Household)
            .Where(x => x.Id == currentUser.Id)
            .AsNoTracking()
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            Logger.Warning("Error: User not found");
            return TypedResults.Problem(Error.NotFound("User not found").ToProblemDetails());
        }

        var response = new GetMeUserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userEntity.UserHouseholds.Select(UserHouseholdResponse.Create),
            userEntity.Budgets.Select(UserBudgetResponse.Create),
            userEntity.Accounts.Select(UserAccountResponse.Create),
            userEntity.Categories.Select(UserCategoryResponse.Create));
        return TypedResults.Ok(response);
    }
}