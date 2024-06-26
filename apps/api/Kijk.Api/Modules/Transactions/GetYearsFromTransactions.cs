﻿using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Transactions;

file record YearDto(List<int> Years);

public static class GetYearsFromTransactions
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetYearsFromTransactions));

    public static RouteGroupBuilder MapGetYearsFromTransactions(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/years", Handle)
            .Produces<ApiResponse<List<int>>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    /// <summary>
    ///     Retrieves all years that have transactions and all years in between.
    /// </summary>
    /// <param name="request"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(
        HttpRequest request,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await dbContext.Users.FindAsync([currentUser.Id], cancellationToken);
            if (user is null)
            {
                return TypedResults.NotFound(ApiResponseBuilder.Error($"User for id '{currentUser.Id}' was not found"));
            }

            var yearsWithTransactions = await dbContext.Accounts
                .AsNoTracking()
                .Where(x => x.UserId == user.Id)
                .SelectMany(x => x.Transactions)
                .Select(x => x.ExecutedAt.Year)
                .Distinct()
                .ToListAsync(cancellationToken);

            List<int> years = [];
            var currentYear = DateTime.UtcNow.Year;
            var minDate = yearsWithTransactions.Count > 0 ? yearsWithTransactions.Min() : currentYear;
            for (int i = minDate; i <= currentYear; i++)
            {
                years.Add(i);
            }

            var response = new YearDto(years.OrderByDescending(x => x).ToList());
            return TypedResults.Ok(ApiResponseBuilder.Success(response));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}
