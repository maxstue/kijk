using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Accounts.Delete;

/// <summary>
/// Deletes unused accounts of the active household.
/// </summary>
public sealed class DeleteAccountHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Deletes an account without transactions.</summary>
    /// <param name="id">The account id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found or conflict error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var account = await dbContext.GetHouseholdAccounts(currentUser)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (account is null)
        {
            return Error.NotFound("Account could not be found");
        }

        if (account.Kind == AccountKind.Cash)
        {
            return Error.Conflict("The cash account cannot be deleted");
        }

        var transactionCount = await dbContext.Transactions.CountAsync(item => item.AccountId == id, cancellationToken);
        if (transactionCount > 0)
        {
            return Error.Conflict($"Account cannot be deleted because it has {transactionCount} transaction(s)");
        }

        if (await dbContext.ImportJobs.AnyAsync(item => item.AccountId == id, cancellationToken))
        {
            return Error.Conflict("Account cannot be deleted because it has imports");
        }

        dbContext.Accounts.Remove(account);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}