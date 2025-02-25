using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Transactions.Endpoints;

public static class DeleteTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteTransaction));

    /// <summary>
    /// Deletes a transaction.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<bool>, ProblemHttpResult>> HandleAsync(
        Guid id,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var foundEntity = await dbContext.Transactions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (foundEntity is null)
        {
            Logger.Warning("Transaction with id {Id} could not be found", id);
            return TypedResults.Problem(Error.NotFound($"Transaction with id '{id}' could not be found").ToProblemDetails());
        }

        dbContext.Transactions.Remove(foundEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(true);
    }
}