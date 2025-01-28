using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Transactions;

public record YearsResponse(List<int> Years);

public static class GetYearsFromTransactions
{
    public static RouteGroupBuilder MapGetYearsFromTransactions(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/years", Handle);

        return groupBuilder;
    }

    /// <summary>
    ///     Retrieves all years that have transactions and all years in between.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<YearsResponse>, ProblemHttpResult>> Handle(AppDbContext dbContext, CurrentUser currentUser,
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

        var response = new YearsResponse([.. years.OrderByDescending(x => x)]);
        return TypedResults.Ok(response);
    }
}