using System.Globalization;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Modules.Transactions;

public static class GetByTransactions
{
    public static RouteGroupBuilder MapGetByTransactions(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/", HandleAsync)
            .Produces<List<TransactionDto>>();

        return groupBuilder;
    }

    /// <summary>
    /// Retrieves all transactions for the current user by year and month.
    /// </summary>
    /// <param name="year"></param>
    /// <param name="month"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<List<TransactionDto>>, ProblemHttpResult>> HandleAsync(
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
            .Select(x => new TransactionDto(
                x.Id,
                x.Name,
                x.Amount,
                x.Type,
                x.ExecutedAt,
                CategoryDto.Create(x.Category)))
            .ToListAsync(cancellationToken);
        return TypedResults.Ok(response);
    }
}