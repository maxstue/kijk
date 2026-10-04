using Kijk.Application.Accounts.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Accounts.Get;

/// <summary>
/// Retrieves the accounts of the active household.
/// </summary>
public sealed class GetAccountsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets all accounts of the active household ordered by name.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The accounts.</returns>
    public async Task<Result<List<AccountResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var accounts = await dbContext.GetHouseholdAccounts(currentUser)
            .OrderBy(account => account.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return accounts.Select(account => account.ToResponse()).ToList();
    }
}