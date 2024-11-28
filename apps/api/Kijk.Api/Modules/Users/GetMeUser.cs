using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Users;

file record GetMeUserResponse(
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
    ///     Gets the current user with all related data.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    private static async Task<IResult> Handle(AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var userEntity = await dbContext.Users
                .Include(x => x.Accounts)
                .ThenInclude(x => x.Transactions)
                .Include(x => x.Categories)
                .Include(x => x.Budgets)
                .Include(x => x.UserHouseholds)
                .ThenInclude(x => x.Household)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                Logger.Warning("Error: User not found");
                return TypedResults.NotFound(ApiResponseBuilder.Error("User not found"));
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
            return TypedResults.Ok(ApiResponseBuilder.Success(response));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}