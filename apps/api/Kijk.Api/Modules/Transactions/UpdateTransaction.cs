using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Transactions;

public record UpdateTransactionRequest(string? Name, decimal? Amount, TransactionType? Type, DateTime? ExecutedAt, Guid? CategoryId);

public static class UpdateTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateTransaction));

    public static RouteGroupBuilder MapUpdateTransaction(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/{id:guid}", Handle)
            .Produces<ApiResponse<TransactionDto>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest);
        return groupBuilder;
    }

    /// <summary>
    ///     Updates an existing transaction.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updateTransactionRequest"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(
        Guid id,
        UpdateTransactionRequest updateTransactionRequest,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        try
        {
            var foundEntity = await dbContext.Transactions
                .Include(x => x.Category)
                .Where(x => x.Id == id)
                .SingleOrDefaultAsync(cancellationToken);

            if (foundEntity == null)
            {
                Logger.Warning("Transaction with id {Id} could not be found", id);
                return TypedResults.NotFound(ApiResponseBuilder.Error($"Transaction with id '{id}' could not be found"));
            }

            foundEntity.Name = updateTransactionRequest.Name ?? foundEntity.Name;
            foundEntity.Amount = updateTransactionRequest.Amount ?? foundEntity.Amount;
            foundEntity.Type = updateTransactionRequest.Type ?? foundEntity.Type;
            foundEntity.ExecutedAt = updateTransactionRequest.ExecutedAt ?? foundEntity.ExecutedAt;

            if (updateTransactionRequest.CategoryId is not null)
            {
                var category = await dbContext.Categories
                    .FindAsync(new object?[] { updateTransactionRequest.CategoryId }, cancellationToken: cancellationToken);

                if (category is not null)
                {
                    foundEntity.Category = category;
                }
                else
                {
                    Logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", updateTransactionRequest.CategoryId);
                    return TypedResults.Conflict(
                        ApiResponseBuilder.Error($"The selected category with id '{updateTransactionRequest.CategoryId}', doesn't exist"));
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            var response = new TransactionDto(
                id,
                foundEntity.Name,
                foundEntity.Amount,
                foundEntity.Type,
                foundEntity.ExecutedAt,
                CategoryDto.Create(foundEntity.Category));

            return TypedResults.Ok(ApiResponseBuilder.Success(response));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}
