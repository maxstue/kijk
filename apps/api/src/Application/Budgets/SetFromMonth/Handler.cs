using Kijk.Application.Budgets.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Budgets.SetFromMonth;

/// <summary>
/// Sets budget versions for the active space.
/// </summary>
public sealed class SetFromMonthHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<SetFromMonthHandler> logger)
{
    private const string DuplicateMessage = "A budget for this category and month was saved in the meantime; try again";

    /// <summary>Sets the version starting in the requested month, preserving earlier and later versions.</summary>
    /// <param name="request">The budget data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The saved budget, or a not-found, validation or conflict error.</returns>
    public async Task<Result<BudgetResponse>> HandleAsync(SetBudgetRequest request, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveSpaceId, cancellationToken);
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (space is null || user is null)
        {
            logger.LogWarning("Active space or user could not be resolved for user {UserId}", currentUser.Id);
            return Error.NotFound("Active space could not be found");
        }

        var category = await dbContext.GetAvailableCategories(currentUser)
            .FirstOrDefaultAsync(item => item.Id == request.CategoryId, cancellationToken);
        if (category is null)
        {
            return Error.NotFound("Category is not available in the active space");
        }

        if (category.Kind != CategoryKind.Expense)
        {
            return Error.Validation("Budgets can only be set for expense categories");
        }

        if (await dbContext.AuthorizeSharedChangeAsync(currentUser, request.Visibility == Visibility.Shared, SpacePermissions.Budgets.Plan, cancellationToken) is { } error)
        {
            return error;
        }

        var validFrom = new MonthYear(request.ValidFrom.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        Guid? ownerId = request.Visibility == Visibility.Private ? user.Id : null;
        var budget = await dbContext.GetVisibleBudgets(currentUser).FirstOrDefaultAsync(
            item => item.SpaceId == space.Id && item.OwnerId == ownerId && item.CategoryId == category.Id && item.ValidFrom == validFrom.Value,
            cancellationToken);
        if (budget is null)
        {
            budget = Budget.Create(request.Amount, validFrom, request.Active, category, user, space, request.Visibility);
            dbContext.Budgets.Add(budget);
        }
        else
        {
            budget.Update(request.Amount, request.Active);
        }
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException) when (dbContext.Budgets.Entry(budget).State == EntityState.Added)
        {
            var duplicateExists = await dbContext.Budgets.AsNoTracking().AnyAsync(
                item => item.SpaceId == space.Id && item.OwnerId == ownerId && item.CategoryId == category.Id && item.ValidFrom == validFrom.Value,
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