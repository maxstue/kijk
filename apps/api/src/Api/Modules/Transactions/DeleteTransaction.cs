using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Transactions;

public static class DeleteTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteTransaction));

    public static RouteGroupBuilder MapDeleteTransaction(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapDelete("/{id:guid}", Handle);
        return groupBuilder;
    }

    /// <summary>
    /// Deletes a transaction.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<bool>, ProblemHttpResult>> Handle(
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