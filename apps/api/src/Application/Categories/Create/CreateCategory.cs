using Kijk.Application.Categories.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Categories.Create;

/// <summary>
/// Creates custom categories for the active household.
/// </summary>
public sealed class CreateCategoryHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateCategoryHandler> logger) : IHandler
{
    /// <summary>Creates a custom category in the active household.</summary>
    /// <param name="request">The category data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created category, or a conflict if the name is already used.</returns>
    public async Task<Result<CategoryResponse>> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveHouseholdId, cancellationToken);
        if (household is null)
        {
            logger.LogWarning("Active household with id '{HouseholdId}' was not found", currentUser.ActiveHouseholdId);
            return Error.NotFound("Active household was not found");
        }

        var name = request.Name.Trim();
        if (await CategoryHelpers.HasNameConflictAsync(dbContext.GetAvailableCategories(currentUser), name, null, cancellationToken))
        {
            return Error.Conflict($"A category with the name '{name}' already exists");
        }

        var category = Category.Create(name, request.Icon, request.Color, request.Kind, household);
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        return category.ToResponse();
    }
}