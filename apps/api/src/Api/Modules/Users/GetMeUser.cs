using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Users;

public record GetMeUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    IEnumerable<UserHouseholdDto>? Households,
    IEnumerable<BudgetDto>? Budgets,
    IEnumerable<AccountDto>? Accounts,
    IEnumerable<CategoryDto>? Categories);

public static class GetMeUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetMeUser));

    public static RouteGroupBuilder MapGetMe(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/me", Handle);
        return groupBuilder;
    }

    /// <summary>
    /// Gets the current user with all related data.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    private static async Task<Results<Ok<GetMeUserResponse>, ProblemHttpResult>> Handle(AppDbContext dbContext, CurrentUser currentUser,
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
            userEntity.UserHouseholds.Select(UserHouseholdDto.Create),
            userEntity.Budgets.Select(BudgetDto.Create),
            userEntity.Accounts.Select(AccountDto.Create),
            userEntity.Categories.Select(CategoryDto.Create));
        return TypedResults.Ok(response);
    }
}