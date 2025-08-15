using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Consumptions;

public record GetYearsConsumptionQueryResponse(IList<int> Years);

/// <summary>
/// Handler for getting all years that have energy usages.
/// </summary>
public static class GetYearsConsumptionHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetYearsConsumptionHandler));
    /// <summary>
    /// Retrieves all years that have energy usages and all years in between.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<GetYearsConsumptionQueryResponse>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var houseHoldId = currentUser.ActiveHouseholdId;
        if (houseHoldId is null)
        {
            Logger.Error("No active household found for user {Id}", currentUser.Id);
            return TypedResults.Problem(Error.NotFound($"Household for user '{currentUser.Id}' was not found").ToProblemDetails());
        }

        var yearsWithEnergy = await dbContext.Households
            .AsNoTracking()
            .Where(x => x.Id == houseHoldId)
            .SelectMany(x => x.Consumptions)
            .Select(x => x.Date.Value.Year)
            .Distinct()
            .ToListAsync(cancellationToken);

        List<int> years = [];
        var currentYear = DateTime.UtcNow.Year;
        var minDate = yearsWithEnergy.Count > 0 ? yearsWithEnergy.Min() : currentYear;
        for (var i = minDate; i <= currentYear; i++)
        {
            years.Add(i);
        }

        var response = new GetYearsConsumptionQueryResponse([.. years.OrderByDescending(x => x)]);
        return TypedResults.Ok(response);
    }
}