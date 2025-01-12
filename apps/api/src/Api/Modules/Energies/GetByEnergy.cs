using System.Globalization;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Modules.Energies;

public record EnergyResponse(Guid Id, string Name, string? Description, decimal Value, EnergyType Type, DateTime Date);

public static class GetByEnergy
{
    public static RouteGroupBuilder MapGetByEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/", HandleAsync);

        return groupBuilder;
    }

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
    private static async Task<Results<Ok<List<EnergyResponse>>, ProblemHttpResult>> HandleAsync([FromQuery(Name = "year")] int? year,
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