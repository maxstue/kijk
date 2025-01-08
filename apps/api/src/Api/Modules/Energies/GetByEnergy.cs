using System.Globalization;

using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Modules.Energies;

public record EnergyResponse(Guid Id, string Name, string? Description, decimal Value, EnergyType Type, DateTime Date);

public static class GetByEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByEnergy));

    public static RouteGroupBuilder MapGetByEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/", HandleAsync)
            .Produces<List<EnergyResponse>>()
            .Produces<List<Error>>(StatusCodes.Status400BadRequest)
            .Produces<List<Error>>(StatusCodes.Status404NotFound);

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
    private static async Task<IResult> HandleAsync([FromQuery(Name = "year")] int? year, [FromQuery(Name = "month")] string? month,
        [FromQuery(Name = "type")] string? type, AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
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
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(e.Message);
        }
    }
}