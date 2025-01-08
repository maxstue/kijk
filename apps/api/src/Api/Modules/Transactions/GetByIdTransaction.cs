using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Transactions;

public static class GetByIdTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByIdTransaction));

    public static RouteGroupBuilder MapGetByIdTransaction(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/{id:guid}", Handle)
            .Produces<TransactionDto>()
            .Produces<List<Error>>(StatusCodes.Status400BadRequest)
            .Produces<List<Error>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    /// <summary>
    ///     Gets a transaction by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(Guid id, AppDbContext dbContext, CancellationToken cancellationToken)
    {
        try
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

            if (transaction is null)
            {
                return TypedResults.NotFound($"Transaction for Id '{id}' was not found.");
            }

            return TypedResults.Ok(transaction);
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(e.Message);
        }
    }
}