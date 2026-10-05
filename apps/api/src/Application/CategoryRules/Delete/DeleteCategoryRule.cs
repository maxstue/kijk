using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.CategoryRules.Delete;

/// <summary>
/// Deletes a remembered category correction. Transactions keep their categories.
/// </summary>
public sealed class DeleteCategoryRuleHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Deletes a rule of the active space.</summary>
    /// <param name="id">The rule id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var rule = await dbContext.CategoryRules
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (rule is null)
        {
            return Error.NotFound("Rule could not be found");
        }

        dbContext.CategoryRules.Remove(rule);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}