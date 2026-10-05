using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Transactions.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Update;

/// <summary>
/// Updates transactions of the active household.
/// </summary>
public sealed class UpdateTransactionHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Updates a transaction of the active household.</summary>
    /// <param name="id">The transaction id.</param>
    /// <param name="request">The new transaction data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated transaction, or a not-found error.</returns>
    public async Task<Result<TransactionResponse>> UpdateAsync(Guid id, UpdateTransactionRequest request, CancellationToken cancellationToken)
    {
        var transaction = await dbContext.GetVisibleTransactions(currentUser)
            .Include(item => item.Account)
            .Include(item => item.Category)
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (transaction is null)
        {
            return Error.NotFound("Transaction could not be found");
        }

        var references = await TransactionReferences.ResolveAsync(dbContext, currentUser, request.AccountId, request.CategoryId, cancellationToken);
        if (references.IsError)
        {
            return references.Error;
        }

        var (account, category) = references.Value;
        transaction.Update(
            new TransactionDetails(
                request.BookingDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                request.Amount,
                TransactionReferences.NormalizeText(request.Counterparty),
                TransactionReferences.NormalizeText(request.Purpose),
                request.Status,
                request.IsTransfer),
            account);

        // Keep the source of an unchanged category, e.g. an AI suggestion stays an AI suggestion.
        if (transaction.CategoryId != category?.Id)
        {
            transaction.AssignCategoryManually(category);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return transaction.ToResponse();
    }
}