using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Shared.Finances;

/// <summary>
/// Provides finance queries shared across application features.
/// </summary>
public static class FinanceQueryExtensions
{
    /// <param name="dbContext">The application database context.</param>
    extension(IAppDbContext dbContext)
    {
        /// <summary>
        /// Returns the categories available to the active household: all system categories and its own categories.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the available categories.</returns>
        public IQueryable<Category> GetAvailableCategories(CurrentUser currentUser) =>
            dbContext.Categories.Where(category =>
                category.CreatorType == CreatorType.System || category.HouseholdId == currentUser.ActiveHouseholdId);

        /// <summary>
        /// Returns the accounts of the active household.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the household's accounts.</returns>
        public IQueryable<Account> GetHouseholdAccounts(CurrentUser currentUser) =>
            dbContext.Accounts.Where(account => account.HouseholdId == currentUser.ActiveHouseholdId);
    }
}