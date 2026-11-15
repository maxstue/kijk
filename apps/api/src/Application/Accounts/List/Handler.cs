using Kijk.Application.Accounts.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Paging;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Accounts.List;

/// <summary>
/// Retrieves the accounts of the active space.
/// </summary>
public sealed class ListHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>
    /// Gets the accounts of the active space whose name or IBAN ending contains the search; bank accounts first, then by
    /// name, unless another sort is requested.
    /// </summary>
    /// <param name="request">The optional search, sort and page.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The accounts.</returns>
    public async Task<Result<PageResponse<AccountResponse>>> HandleAsync(ListRequest<AccountSort> request, CancellationToken cancellationToken)
    {
        var query = dbContext.GetSpaceAccounts(currentUser).AsNoTracking();
        if (request.Search.ToContainsPattern() is { } pattern)
        {
            query = query.Where(account => EF.Functions.ILike(account.Name, pattern, PagingExtensions.LikeEscape)
                                           || EF.Functions.ILike(account.IbanLast4!, pattern, PagingExtensions.LikeEscape));
        }

        var ordered = request.Sort == AccountSort.Name
            ? query.OrderBy(account => account.Name, request.Descending)
            : query.OrderBy(account => account.Kind, request.Descending).ThenBy(account => account.Name);
        var page = await ordered.ThenBy(account => account.Id).ToPageAsync(request.Page, request.PageSize, cancellationToken);
        return page.Map(account => account.ToResponse());
    }
}