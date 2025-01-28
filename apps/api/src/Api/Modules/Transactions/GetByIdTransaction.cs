using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Transactions;

public static class GetByIdTransaction
{

    public static RouteGroupBuilder MapGetByIdTransaction(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/{id:guid}", Handle);
        return groupBuilder;
    }

    /// <summary>
    /// Gets a transaction by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<TransactionDto>, ProblemHttpResult>> Handle(Guid id, AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var transaction = await dbContext.Transactions
            .Where(x => x.Id == id)
            .Select(x => new TransactionDto(
                x.Id,
                x.Name,
                x.Amount,
                x.Type,
                x.ExecutedAt,
                CategoryDto.Create(x.Category)))
            .FirstOrDefaultAsync(cancellationToken);

        return transaction is null
            ? TypedResults.Problem(Error.NotFound($"Transaction for Id '{id}' was not found.").ToProblemDetails())
            : TypedResults.Ok(transaction);
    }
}