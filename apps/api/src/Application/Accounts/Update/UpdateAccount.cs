using Kijk.Application.Accounts.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Accounts.Update;

/// <summary>
/// Updates accounts of the active space.
/// </summary>
public sealed class UpdateAccountHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Updates an account of the active space.</summary>
    /// <param name="id">The account id.</param>
    /// <param name="request">The new account data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated account, or a not-found error.</returns>
    public async Task<Result<AccountResponse>> UpdateAsync(Guid id, UpdateAccountRequest request, CancellationToken cancellationToken)
    {
        var account = await dbContext.GetSpaceAccounts(currentUser)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (account is null)
        {
            return Error.NotFound("Account could not be found");
        }

        var visibility = request.Visibility ?? account.Visibility;
        var touchesShared = account.Visibility == Visibility.Shared || visibility == Visibility.Shared;
        if (await dbContext.AuthorizeSharedChangeAsync(currentUser, touchesShared, SpacePermissions.Finances.Configure, cancellationToken) is { } error)
        {
            return error;
        }

        account.Update(request.Name.Trim(), request.IbanLast4?.ToUpperInvariant());
        account.SetOwner(visibility == Visibility.Private ? currentUser.Id : null);
        await dbContext.SaveChangesAsync(cancellationToken);

        return account.ToResponse();
    }
}