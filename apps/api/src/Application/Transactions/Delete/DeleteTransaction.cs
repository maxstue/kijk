using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Delete;

/// <summary>
/// Deletes transactions of the active space.
/// </summary>
public sealed class DeleteTransactionHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Deletes a transaction of the active space.</summary>
    /// <param name="id">The transaction id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var transaction = await dbContext.GetVisibleTransactions(currentUser)
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (transaction is null)
        {
            return Error.NotFound("Transaction could not be found");
        }

        dbContext.Transactions.Remove(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}