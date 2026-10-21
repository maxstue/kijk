using Kijk.Application.Imports.Categorization;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.AiDataPreview;

/// <summary>
/// Shows exactly what the AI categorization of an import would send.
/// </summary>
public sealed class AiDataPreviewHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>Gets the texts the AI categorization would send.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The preview, or a not-found error.</returns>
    public async Task<Result<AiPreviewResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        if (await FindSpaceAsync(id, cancellationToken) is not { } spaceId)
        {
            return Error.NotFound("Import could not be found");
        }

        var (contexts, withheld) = await BuildAsync(id, spaceId, cancellationToken);
        return new AiPreviewResponse(
            [
                .. contexts.Select(context => new AiPreviewItemResponse(
                    context.Key,
                    context.Item.Counterparty,
                    context.Item.Purpose,
                    context.Item.IsIncome,
                    context.Rows.Count,
                    context.Rows.TrueForAll(row => row.AiExcluded)))
            ],
            withheld);
    }

    private async Task<(List<AiContext> Contexts, int Withheld)> BuildAsync(Guid id, Guid spaceId, CancellationToken cancellationToken)
    {
        var candidates = await AiContexts.Eligible(dbContext, id).ToListAsync(cancellationToken);
        var memberNames = await AiContexts.LoadMemberNamesAsync(dbContext, spaceId, cancellationToken);
        return AiContexts.Build(candidates, memberNames);
    }

    private Task<Guid?> FindSpaceAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.GetVisibleImports(currentUser)
            .Where(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId)
            .Select(item => (Guid?)item.SpaceId)
            .FirstOrDefaultAsync(cancellationToken);
}