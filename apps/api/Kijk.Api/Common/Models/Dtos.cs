using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Common.Models;

public record UserHouseholdDto(Guid Id, string Name, string? Description, string Role, bool IsDefault)
{
    public static UserHouseholdDto Create(UserHousehold userHousehold) =>
        new(
            userHousehold.Id, userHousehold.Household.Name, userHousehold.Household.Description, userHousehold.Role.ToStringFast(),
            userHousehold.IsDefault);
}

public record BudgetDto(
    Guid Id,
    string Name,
    decimal Limit,
    decimal ActualSpending,
    BudgetStatus Status,
    Visibility Visibility,
    Guid HouseholdId,
    DateOnly StartDate,
    DateOnly? EndDate,
    CategoryDto Category)
{
    public static BudgetDto Create(Budget budget) =>
        new(
            budget.Id, budget.Name, budget.Limit, budget.ActualSpending, budget.Status, budget.Visibility, budget.HouseholdId, budget.StartDate,
            budget.EndDate,
            CategoryDto.Create(budget.Category));
}

public record AccountDto(Guid Id, string Name, decimal Balance, string Type, IEnumerable<TransactionDto> Transactions)
{
    public static AccountDto Create(Account account) =>
        new(account.Id, account.Name, account.Balance, account.Type.ToStringFast(), account.Transactions.Select(TransactionDto.Create));
}

public record TransactionDto(Guid Id, string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, CategoryDto? Category)
{
    public static TransactionDto Create(Transaction transaction) =>
        new(transaction.Id, transaction.Name, transaction.Amount, transaction.Type, transaction.ExecutedAt, CategoryDto.Create(transaction.Category));
}

public record CategoryDto(Guid Id, string Name, string Color, CategoryType Type, CategoryCreatorType CreatorType)
{
    public static CategoryDto Create(Category category) =>
        new(category.Id, category.Name, category.Color, category.Type, category.CreatorType);
}

public record SimpleAuthUser(Guid Id, string AuthId, string Name, string? Email, bool? FirstTime = false)
{
    public static SimpleAuthUser Create(User user) =>
        new(user.Id, user.AuthId, user.Name, user.Email, user.FirstTime);
}
