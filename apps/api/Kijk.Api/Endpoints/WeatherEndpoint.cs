using Microsoft.AspNetCore.Mvc;

using Kijk.Api.Application.Weathers;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Filters;
using Kijk.Api.Common.Models;

namespace Kijk.Api.Endpoints;

public static class WeatherEndpoint
{
    public static IEndpointRouteBuilder MapWeatherEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/w");

        group.MapGet("/", GetAllWeathers);
        group.MapGet("/auth", GetAllWeathers);
            // .RequireAuthorization(AppConstants.Roles.Admin);
        group.MapGet("/{id:guid}", GetWeatherById);
        group.MapPost("/", CreateWeather).AddEndpointFilter<ValidationFilter<WeatherDTO>>();
        group.MapPut("/{id:guid}", UpdateWeather);
        group.MapDelete("/{id:guid}", DeleteWeatherById);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> GetAllWeathers(IWeatherService service, CurrentUser user)
    {
        var result = await service.GetAll();
        return result.ToResponse("Erfolgreich geladen");
    }

    private static async Task<IResult> GetWeatherById(IWeatherService service, Guid id, CancellationToken token)
    {
        var result = await service.GetById(id, token);
        return result.ToResponse("Erfolgreich geladen");
    }

    private static async Task<IResult> CreateWeather(
        IWeatherService service,
        [FromBody] WeatherDTO weatherDto,
        CancellationToken token)
    {
        var result = await service.Create(weatherDto, token);
        return result.ToResponse("Erfolgreich erstellt", SuccessType.Created);
    }

    private static async Task<IResult> UpdateWeather(
        IWeatherService service,
        Guid id,
        WeatherDTO updatedWeatherDto,
        CancellationToken token)
    {
        var result = await service.Update(id, updatedWeatherDto, token);

        return result.ToResponse("Erfolgreich bearbeitet");
    }

    private static async Task<IResult> DeleteWeatherById(IWeatherService service, Guid id, CancellationToken token)
    {
        var result = await service.Delete(id, token);
        return result.ToResponse("Erfolgreich gelöscht");
    }
}
