using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions;

public record GetYearsConsumptionQueryResponse(IList<int> Years);

/// <summary>
/// Handler for getting all years that have energy usages.
/// </summary>
public class GetYearsConsumptionHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<GetByIdConsumptionHandler> logger) : IHandler
{
    /// <summary>
    /// Retrieves all years that have consumption usages and all years in between.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<Result<GetYearsConsumptionQueryResponse>> GetYearsAsync(CancellationToken cancellationToken)
    {
        var houseHoldId = currentUser.ActiveHouseholdId;
        if (houseHoldId is null)
        {
            logger.LogError("No active household found for user {Id}", currentUser.Id);
            return Error.NotFound($"Household for user '{currentUser.Id}' was not found");
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
        return response;
    }
}