using Kijk.Application.Budgets.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Budgets.Create;

/// <summary>
/// Creates budgets for the active household.
/// </summary>
public sealed class CreateBudgetHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateBudgetHandler> logger) : IHandler
{
    private const string DuplicateMessage = "A budget already starts in this month for this category";

    /// <summary>Creates a budget version for an expense category.</summary>
    /// <param name="request">The budget data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created budget, or a not-found, validation or conflict error.</returns>
    public async Task<Result<BudgetResponse>> CreateAsync(CreateBudgetRequest request, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveHouseholdId, cancellationToken);
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (household is null || user is null)
        {
            logger.LogWarning("Active household or user could not be resolved for user {UserId}", currentUser.Id);
            return Error.NotFound("Active household could not be found");
        }

        var category = await dbContext.GetAvailableCategories(currentUser)
            .FirstOrDefaultAsync(item => item.Id == request.CategoryId, cancellationToken);
        if (category is null)
        {
            return Error.NotFound("Category is not available in the active household");
        }

        if (category.Kind != CategoryKind.Expense)
        {
            return Error.Validation("Budgets can only be set for expense categories");
        }

        if (await dbContext.AuthorizeSharedChangeAsync(currentUser, request.Visibility == Visibility.Shared, HouseholdPermissions.Budgets.Plan, cancellationToken) is { } error)
        {
            return error;
        }

        var validFrom = new MonthYear(request.ValidFrom.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        Guid? ownerId = request.Visibility == Visibility.Private ? user.Id : null;
        var exists = await dbContext.Budgets.AnyAsync(
            item => item.HouseholdId == household.Id && item.OwnerId == ownerId && item.CategoryId == category.Id && item.ValidFrom == validFrom.Value,
            cancellationToken);
        if (exists)
        {
            return Error.Conflict(DuplicateMessage);
        }

        var budget = Budget.Create(request.Amount, validFrom, request.Active, category, user, household, request.Visibility);
        dbContext.Budgets.Add(budget);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateExists = await dbContext.Budgets.AsNoTracking().AnyAsync(
                item => item.HouseholdId == household.Id && item.OwnerId == ownerId && item.CategoryId == category.Id && item.ValidFrom == validFrom.Value,
                cancellationToken);
            if (!duplicateExists)
            {
                throw;
            }

            return Error.Conflict(DuplicateMessage);
        }

        return budget.ToResponse();
    }
}