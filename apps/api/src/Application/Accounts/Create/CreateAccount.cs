using Kijk.Application.Accounts.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Accounts.Create;

/// <summary>
/// Creates accounts for the active household.
/// </summary>
public sealed class CreateAccountHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateAccountHandler> logger) : IHandler
{
    /// <summary>Creates an account in the active household.</summary>
    /// <param name="request">The account data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created account.</returns>
    public async Task<Result<AccountResponse>> CreateAsync(CreateAccountRequest request, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveHouseholdId, cancellationToken);
        if (household is null)
        {
            logger.LogWarning("Active household with id '{HouseholdId}' was not found", currentUser.ActiveHouseholdId);
            return Error.NotFound("Active household was not found");
        }

        var account = Account.Create(request.Name.Trim(), request.IbanLast4?.ToUpperInvariant(), household);
        dbContext.Accounts.Add(account);
        await dbContext.SaveChangesAsync(cancellationToken);

        return account.ToResponse();
    }
}