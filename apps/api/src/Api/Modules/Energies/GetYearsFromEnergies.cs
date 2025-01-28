using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Energies;

public record YearsResponse(List<int> Years);

public static class GetYearsFromEnergies
{
    public static RouteGroupBuilder MapGetYearsFromEnergies(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/years", Handle);

        return groupBuilder;
    }

    /// <summary>
    /// Retrieves all years that have energy usages and all years in between.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<YearsResponse>, ProblemHttpResult>> Handle(AppDbContext dbContext, CurrentUser currentUser,
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

        var response = new YearsResponse([.. years.OrderByDescending(x => x)]);
        return TypedResults.Ok(response);
    }
}