using System.Globalization;
using Kijk.Application.Transactions.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Application.Transactions.Endpoints;

public static class GetByTransactions
{
    /// <summary>
    /// Retrieves all transactions for the current user by year and month.
    /// </summary>
    /// <param name="year"></param>
    /// <param name="month"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<List<TransactionResponse>>, ProblemHttpResult>> HandleAsync(
        [FromQuery(Name = "year")] int? year,
        [FromQuery(Name = "month")] string? month,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var monthInt = month is not null ? DateTime.ParseExact(month, "MMMM", CultureInfo.InvariantCulture).Month : -1;

        var response = await dbContext.Accounts
            .AsNoTracking()
            .Where(x => x.UserId == currentUser.Id)
            .SelectMany(x => x.Transactions)
            .If(year != null, q => q.Where(x => x.ExecutedAt.Year == year))
            .If(monthInt != -1, q => q.Where(x => x.ExecutedAt.Month == monthInt))
            .Select(x => new TransactionResponse(
                x.Id,
                x.Name,
                x.Amount,
                x.Type,
                x.ExecutedAt,
                TransactionCategoryResponse.Create(x.Category)))
            .ToListAsync(cancellationToken);
        return TypedResults.Ok(response);
    }
}