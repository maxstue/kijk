using Kijk.Application.Shared.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Years;

/// <summary>
/// Handler for getting all years that have energy usages.
/// </summary>
public class YearsHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<YearsHandler> logger)
{
    /// <summary>
    /// Retrieves all years that have consumption usages and all years in between.
    /// </summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The years with consumptions.</returns>
    public async Task<Result<GetYearsConsumptionQueryResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        var spaceId = currentUser.ActiveSpaceId;
        if (spaceId is null)
        {
            logger.LogWarning("No active space found for user '{Id}'", currentUser.Id);
            return Error.NotFound("No active space found");
        }

        var yearsWithEnergy = await dbContext.Spaces
            .AsNoTracking()
            .Where(x => x.Id == spaceId)
            .SelectMany(x => x.Consumptions)
            .Select(x => x.Date.Year)
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