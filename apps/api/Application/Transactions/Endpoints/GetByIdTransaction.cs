using Kijk.Application.Transactions.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Transactions.Endpoints;

public static class GetByIdTransaction
{
    /// <summary>
    /// Gets a transaction by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<TransactionResponse>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var transaction = await dbContext.Transactions
            .Where(x => x.Id == id)
            .Select(x => new TransactionResponse(
                x.Id,
                x.Name,
                x.Amount,
                x.Type,
                x.ExecutedAt,
                TransactionCategoryResponse.Create(x.Category)))
            .FirstOrDefaultAsync(cancellationToken);

        return transaction is null
            ? TypedResults.Problem(Error.NotFound($"Transaction for Id '{id}' was not found.").ToProblemDetails())
            : TypedResults.Ok(transaction);
    }
}