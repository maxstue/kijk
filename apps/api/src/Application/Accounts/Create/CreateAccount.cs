using Kijk.Application.Accounts.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Accounts.Create;

/// <summary>
/// Creates accounts for the active space.
/// </summary>
public sealed class CreateAccountHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateAccountHandler> logger) : IHandler
{
    /// <summary>Creates an account in the active space.</summary>
    /// <param name="request">The account data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created account.</returns>
    public async Task<Result<AccountResponse>> CreateAsync(CreateAccountRequest request, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveSpaceId, cancellationToken);
        if (space is null)
        {
            logger.LogWarning("Active space with id '{SpaceId}' was not found", currentUser.ActiveSpaceId);
            return Error.NotFound("Active space was not found");
        }

        if (await dbContext.AuthorizeSharedChangeAsync(currentUser, request.Visibility == Visibility.Shared, SpacePermissions.Finances.Configure, cancellationToken) is { } error)
        {
            return error;
        }

        var account = Account.Create(request.Name.Trim(), request.IbanLast4?.ToUpperInvariant(), space);
        // A private account belongs to its creator; in a personal space everything is private anyway.
        account.SetOwner(request.Visibility == Visibility.Private ? currentUser.Id : null);
        dbContext.Accounts.Add(account);
        await dbContext.SaveChangesAsync(cancellationToken);

        return account.ToResponse();
    }
}