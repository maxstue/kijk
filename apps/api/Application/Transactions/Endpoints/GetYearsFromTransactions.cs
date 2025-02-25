using Kijk.Application.Transactions.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Transactions.Endpoints;

public static class GetYearsFromTransactions
{
    /// <summary>
    /// Retrieves all years that have transactions and all years in between.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<TransactionYearsResponse>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var yearsWithTransactions = await dbContext.Accounts
            .AsNoTracking()
            .Where(x => x.UserId == currentUser.Id)
            .SelectMany(x => x.Transactions)
            .Select(x => x.ExecutedAt.Year)
            .Distinct()
            .ToListAsync(cancellationToken);

        List<int> years = [];
        var currentYear = DateTime.UtcNow.Year;
        var minDate = yearsWithTransactions.Count > 0 ? yearsWithTransactions.Min() : currentYear;
        for (var i = minDate; i <= currentYear; i++)
        {
            years.Add(i);
        }

        var response = new TransactionYearsResponse([.. years.OrderByDescending(x => x)]);
        return TypedResults.Ok(response);
    }
}