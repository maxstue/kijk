using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Transactions;

public record UpdateTransactionRequest(string? Name, decimal? Amount, TransactionType? Type, DateTime? ExecutedAt, Guid? CategoryId);

public static class UpdateTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateTransaction));

    public static RouteGroupBuilder MapUpdateTransaction(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/{id:guid}", Handle);
        return groupBuilder;
    }

    /// <summary>
    /// Updates an existing transaction.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updateTransactionRequest"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<TransactionDto>, ProblemHttpResult>> Handle(
        Guid id,
        UpdateTransactionRequest updateTransactionRequest,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var foundEntity = await dbContext.Transactions
            .Include(x => x.Category)
            .Where(x => x.Id == id)
            .SingleOrDefaultAsync(cancellationToken);

        if (foundEntity is null)
        {
            Logger.Warning("Transaction with id {Id} could not be found", id);
            return TypedResults.Problem(Error.NotFound($"Transaction with id '{id}' could not be found").ToProblemDetails());
        }

        foundEntity.Name = updateTransactionRequest.Name ?? foundEntity.Name;
        foundEntity.Amount = updateTransactionRequest.Amount ?? foundEntity.Amount;
        foundEntity.Type = updateTransactionRequest.Type ?? foundEntity.Type;
        foundEntity.ExecutedAt = updateTransactionRequest.ExecutedAt ?? foundEntity.ExecutedAt;

        if (updateTransactionRequest.CategoryId is not null)
        {
            var category = await dbContext.Categories.FirstOrDefaultAsync(x => x.Id == updateTransactionRequest.CategoryId, cancellationToken);
            if (category is not null)
            {
                foundEntity.Category = category;
            }
            else
            {
                Logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", updateTransactionRequest.CategoryId);
                return TypedResults.Problem(Error.Validation($"The selected category with id '{updateTransactionRequest.CategoryId}', doesn't exist")
                    .ToProblemDetails());
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new TransactionDto(
            id,
            foundEntity.Name,
            foundEntity.Amount,
            foundEntity.Type,
            foundEntity.ExecutedAt,
            CategoryDto.Create(foundEntity.Category)));
    }
}