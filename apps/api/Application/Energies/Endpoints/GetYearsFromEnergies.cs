using Kijk.Application.Energies.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Energies.Endpoints;

public static class GetYearsFromEnergies
{
    /// <summary>
    /// Retrieves all years that have energy usages and all years in between.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<EnergyYearsResponse>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var houseHoldId = currentUser.ActiveHouseholdId;
        if (houseHoldId is null)
        {
            return TypedResults.Problem(Error.NotFound($"Household for user '{currentUser.Id}' was not found").ToProblemDetails());
        }

        var yearsWithEnergy = await dbContext.Households
            .AsNoTracking()
            .Where(x => x.Id == houseHoldId)
            .SelectMany(x => x.Energies)
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

        var response = new EnergyYearsResponse([.. years.OrderByDescending(x => x)]);
        return TypedResults.Ok(response);
    }
}