using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Users.Models;

public record UserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    bool? UseDefaultCategories);

public record GetMeUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    IEnumerable<UserHouseholdResponse>? Households,
    IEnumerable<UserBudgetResponse>? Budgets,
    IEnumerable<UserAccountResponse>? Accounts,
    IEnumerable<UserCategoryResponse>? Categories);

public record UserAccountResponse(Guid Id, string Name, decimal Balance, string Type, IEnumerable<UserTransactionResponse> Transactions)
{
    public static UserAccountResponse Create(Account account) =>
        new(account.Id, account.Name, account.Balance, account.Type.ToStringFast(), account.Transactions.Select(UserTransactionResponse.Create));
}

public record UserBudgetResponse(
    Guid Id,
    string Name,
    decimal Limit,
    decimal ActualSpending,
    BudgetStatus Status,
    Visibility Visibility,
    Guid HouseholdId,
    DateOnly StartDate,
    DateOnly? EndDate,
    UserCategoryResponse UserCategory)
{
    public static UserBudgetResponse Create(Budget budget) =>
        new(budget.Id, budget.Name, budget.Limit, budget.ActualSpending, budget.Status, budget.Visibility, budget.HouseholdId, budget.StartDate,
            budget.EndDate, UserCategoryResponse.Create(budget.Category));
}

public record UserHouseholdResponse(Guid Id, string Name, string? Description, string Role, bool IsDefault)
{
    public static UserHouseholdResponse Create(UserHousehold userHousehold) =>
        new(userHousehold.Id, userHousehold.Household.Name, userHousehold.Household.Description, userHousehold.Role.ToStringFast(),
            userHousehold.IsDefault);
}

public record UserTransactionResponse(Guid Id, string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, UserCategoryResponse? Category)
{
    public static UserTransactionResponse Create(Transaction transaction) =>
        new(transaction.Id, transaction.Name, transaction.Amount, transaction.Type, transaction.ExecutedAt,
            UserCategoryResponse.Create(transaction.Category));
}

public record UserCategoryResponse(Guid Id, string Name, string Color, CategoryType Type, CategoryCreatorType CreatorType)
{
    public static UserCategoryResponse Create(Category category) =>
        new(category.Id, category.Name, category.Color, category.Type, category.CreatorType);
}