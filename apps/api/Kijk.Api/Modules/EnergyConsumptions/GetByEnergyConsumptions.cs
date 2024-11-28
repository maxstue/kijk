using System.Globalization;

using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Modules.EnergyConsumptions;

public static class GetByEnergyConsumptions
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByEnergyConsumptions));

    public static RouteGroupBuilder MapGetByEnergyConsumptions(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/", Handle)
            .Produces<ApiResponse<List<EnergyConsumptionDto>>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound);

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
    private static async Task<IResult> Handle(
        [FromQuery(Name = "year")] int? year,
        [FromQuery(Name = "month")] string? month,
        [FromQuery(Name = "type")] string? type,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        try
        {
            var monthInt = month is not null ? DateTime.ParseExact(month, "MMMM", CultureInfo.InvariantCulture).Month : -1;

            var typeExists = Enum.TryParse<EnergyConsumptionType>(type, true, out var realType);

            var response = await dbContext.EnergyConsumptions
                .AsNoTracking()
                .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
                .If(year != null, q => q.Where(x => x.Date.Year == year))
                .If(monthInt != -1, q => q.Where(x => x.Date.Month == monthInt))
                .If(typeExists, q => q.Where(x => x.Type == realType))
                .Select(
                    x => new EnergyConsumptionDto(
                        x.Id,
                        x.Name,
                        x.Description,
                        x.Value,
                        x.Type, x.CreatedAt))
                .ToListAsync(cancellationToken);

            return TypedResults.Ok(ApiResponseBuilder.Success(response));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}