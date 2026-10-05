using Kijk.Application.Accounts.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Accounts.Get;

/// <summary>
/// Retrieves the accounts of the active space.
/// </summary>
public sealed class GetAccountsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets all accounts of the active space, bank accounts first, then by name.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The accounts.</returns>
    public async Task<Result<List<AccountResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var accounts = await dbContext.GetSpaceAccounts(currentUser)
            .OrderBy(account => account.Kind)
            .ThenBy(account => account.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return accounts.Select(account => account.ToResponse()).ToList();
    }
}