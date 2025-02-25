using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Models;

public record TransactionResponse(
    Guid Id,
    string Name,
    decimal Amount,
    TransactionType Type,
    DateTime ExecutedAt,
    TransactionCategoryResponse? Category)
{
    public static TransactionResponse Create(Transaction transaction) =>
        new(transaction.Id, transaction.Name, transaction.Amount, transaction.Type, transaction.ExecutedAt,
            TransactionCategoryResponse.Create(transaction.Category));
}

public record TransactionCategoryResponse(Guid Id, string Name, string Color, CategoryType Type, CategoryCreatorType CreatorType)
{
    public static TransactionCategoryResponse Create(Category category) =>
        new(category.Id, category.Name, category.Color, category.Type, category.CreatorType);
}

public record TransactionYearsResponse(List<int> Years);