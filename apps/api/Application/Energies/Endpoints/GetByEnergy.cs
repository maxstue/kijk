using System.Globalization;
using Kijk.Application.Energies.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Application.Energies.Endpoints;

public static class GetByEnergy
{
    /// <summary>
    /// Retrieves all energy consumptions for the current user by year, month and type.
    /// </summary>
    /// <param name="year"></param>
    /// <param name="month"></param>
    /// <param name="type"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<List<EnergyResponse>>, ProblemHttpResult>> HandleAsync([FromQuery(Name = "year")] int? year,
        [FromQuery(Name = "month")] string? month,
        [FromQuery(Name = "type")] string? type, AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var monthInt = month is not null ? DateTime.ParseExact(month, "MMMM", CultureInfo.InvariantCulture).Month : -1;

        var typeExists = Enum.TryParse<EnergyType>(type, true, out var realType);

        var response = await dbContext.Energy
            .AsNoTracking()
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .If(year != null, q => q.Where(x => x.Date.Year == year))
            .If(monthInt != -1, q => q.Where(x => x.Date.Month == monthInt))
            .If(typeExists, q => q.Where(x => x.Type == realType))
            .Select(x => new EnergyResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Value,
                x.Type,
                x.Date))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(response);
    }
}