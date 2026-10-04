using Kijk.Application.Accounts.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Accounts.Update;

/// <summary>
/// Updates accounts of the active household.
/// </summary>
public sealed class UpdateAccountHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Updates an account of the active household.</summary>
    /// <param name="id">The account id.</param>
    /// <param name="request">The new account data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated account, or a not-found error.</returns>
    public async Task<Result<AccountResponse>> UpdateAsync(Guid id, UpdateAccountRequest request, CancellationToken cancellationToken)
    {
        var account = await dbContext.GetHouseholdAccounts(currentUser)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (account is null)
        {
            return Error.NotFound("Account could not be found");
        }

        account.Update(request.Name.Trim(), request.IbanLast4?.ToUpperInvariant());
        await dbContext.SaveChangesAsync(cancellationToken);

        return account.ToResponse();
    }
}