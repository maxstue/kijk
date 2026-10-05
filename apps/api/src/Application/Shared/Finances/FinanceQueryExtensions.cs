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
        /// Returns the categories available to the active space: all system categories and its own categories.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the available categories.</returns>
        public IQueryable<Category> GetAvailableCategories(CurrentUser currentUser) =>
            dbContext.Categories.Where(category =>
                category.CreatorType == CreatorType.System || category.SpaceId == currentUser.ActiveSpaceId);

        /// <summary>
        /// Returns the accounts of the active space the current member may see: shared ones and their own private
        /// ones.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the visible accounts.</returns>
        public IQueryable<Account> GetSpaceAccounts(CurrentUser currentUser) =>
            dbContext.Accounts.Where(account => account.SpaceId == currentUser.ActiveSpaceId
                                                && (account.OwnerId == null || account.OwnerId == currentUser.Id));

        /// <summary>
        /// Returns the transactions of the active space the current member may see. Transactions inherit the
        /// visibility of their account.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the visible transactions.</returns>
        public IQueryable<Transaction> GetVisibleTransactions(CurrentUser currentUser) =>
            dbContext.Transactions.Where(transaction => transaction.SpaceId == currentUser.ActiveSpaceId
                                                        && (transaction.Account == null
                                                            || transaction.Account.OwnerId == null
                                                            || transaction.Account.OwnerId == currentUser.Id));

        /// <summary>
        /// Returns the budget versions of the active space the current member may see: shared ones and their own
        /// private ones.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the visible budgets.</returns>
        public IQueryable<Budget> GetVisibleBudgets(CurrentUser currentUser) =>
            dbContext.Budgets.Where(budget => budget.SpaceId == currentUser.ActiveSpaceId
                                              && (budget.OwnerId == null || budget.OwnerId == currentUser.Id));

        /// <summary>
        /// Returns the imports of the active space the current member may see; imports inherit the visibility of
        /// their account.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the visible imports.</returns>
        public IQueryable<ImportJob> GetVisibleImports(CurrentUser currentUser) =>
            dbContext.ImportJobs.Where(job => job.SpaceId == currentUser.ActiveSpaceId
                                              && (job.Account.OwnerId == null || job.Account.OwnerId == currentUser.Id));
    }
}