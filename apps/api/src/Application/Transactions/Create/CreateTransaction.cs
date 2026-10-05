using Kijk.Application.Shared.Persistence;
using Kijk.Application.Transactions.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Transactions.Create;

/// <summary>
/// Records transactions manually for the active space.
/// </summary>
public sealed class CreateTransactionHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateTransactionHandler> logger) : IHandler
{
    /// <summary>Records a transaction in the active space.</summary>
    /// <param name="request">The transaction data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created transaction, or a not-found error.</returns>
    public async Task<Result<TransactionResponse>> CreateAsync(CreateTransactionRequest request, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveSpaceId, cancellationToken);
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (space is null || user is null)
        {
            logger.LogWarning("Active space or user could not be resolved for user {UserId}", currentUser.Id);
            return Error.NotFound("Active space could not be found");
        }

        var references = await TransactionReferences.ResolveAsync(dbContext, currentUser, request.AccountId, request.CategoryId, cancellationToken);
        if (references.IsError)
        {
            return references.Error;
        }

        var (account, category) = references.Value;
        var transaction = Transaction.Create(
            new TransactionDetails(
                request.BookingDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                request.Amount,
                TransactionReferences.NormalizeText(request.Counterparty),
                TransactionReferences.NormalizeText(request.Purpose),
                request.Status,
                request.IsTransfer),
            account,
            user,
            space);
        transaction.AssignCategoryManually(category);

        dbContext.Transactions.Add(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return transaction.ToResponse();
    }
}