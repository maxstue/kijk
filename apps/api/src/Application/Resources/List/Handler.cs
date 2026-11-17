using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Paging;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.List;

/// <summary>
/// Handler for getting all resources.
/// </summary>
public class ListHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<ListHandler> logger)
{
    /// <summary>
    /// Gets the resources available in the active space whose name or unit contains the search, ordered by name unless
    /// another sort is requested.
    /// </summary>
    /// <param name="request">The optional search, sort and page.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The resources.</returns>
    public async Task<Result<PageResponse<ResourceResponse>>> HandleAsync(ListRequest<ResourceSort> request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Users.AnyAsync(user => user.Id == currentUser.Id, cancellationToken))
        {
            logger.LogWarning("User with id '{UserId}' was not found", currentUser.Id);
            return Error.NotFound("User was not found");
        }

        var query = dbContext.GetUserAvailableResources(currentUser).AsNoTracking();
        if (request.Search.ToContainsPattern() is { } pattern)
        {
            // Resource and unit names use a case-insensitive collation, which supports LIKE but not ILIKE.
            query = query.Where(resource => EF.Functions.Like(resource.Name, pattern, PagingExtensions.LikeEscape)
                                            || EF.Functions.Like(resource.Unit.Name, pattern, PagingExtensions.LikeEscape)
                                            || EF.Functions.Like(resource.Unit.Symbol, pattern, PagingExtensions.LikeEscape));
        }

        var ordered = request.Sort switch
        {
            ResourceSort.Unit => query.OrderBy(resource => resource.Unit.Symbol, request.Descending).ThenBy(resource => resource.Name),
            ResourceSort.Color => query.OrderBy(resource => resource.Color, request.Descending).ThenBy(resource => resource.Name),
            ResourceSort.CreatorType => query.OrderBy(resource => resource.CreatorType, request.Descending).ThenBy(resource => resource.Name),
            _ => query.OrderBy(resource => resource.Name, request.Descending)
        };
        return await ordered.ThenBy(resource => resource.Id)
            .ToResponse()
            .ToPageAsync(request.Page, request.PageSize, cancellationToken);
    }
}