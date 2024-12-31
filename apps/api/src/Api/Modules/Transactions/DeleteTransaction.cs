using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Transactions;

public static class DeleteTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteTransaction));

    public static RouteGroupBuilder MapDeleteTransaction(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapDelete("/{id:guid}", Handle)
            .Produces<ApiResponse<bool>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    /// <summary>
    ///     Deletes a transaction.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(
        Guid id,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        try
        {
            var foundEntity = await dbContext.Transactions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (foundEntity == null)
            {
                Logger.Warning("Transaction with id {Id} could not be found", id);
                return TypedResults.NotFound(ApiResponseBuilder.Error($"Transaction with id '{id}' could not be found"));
            }

            dbContext.Transactions.Remove(foundEntity);
            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(ApiResponseBuilder.Success(true));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}