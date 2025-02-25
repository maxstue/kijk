using Kijk.Application.Energies.Endpoints;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for energies.
/// </summary>
public static class EnergiesEndpoint
{
    public static IEndpointRouteBuilder MapEnergyConsumptionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/energies")
            .WithTags("Energies");

        group.MapGet("", GetByEnergy.HandleAsync)
            .WithSummary("Gets all energy consumptions");

        group.MapGet("/{id:guid}", GetByIdEnergy.HandleAsync)
            .WithSummary("Gets an energy consumption");

        group.MapGet("/stats", GetStatsEnergy.HandleAsync)
            .WithSummary("Gets all energy stats");

        group.MapGet("/years", GetYearsFromEnergies.HandleAsync)
            .WithSummary("Gets all energy years");

        group.MapPost("", CreateEnergy.HandleAsync)
            .WithSummary("Creates a new energy");

        group.MapPut("/{id:guid}", UpdateEnergy.HandleAsync)
            .WithSummary("Updates an energy");

        group.MapDelete("/{id:guid}", DeleteEnergy.HandleAsync)
            .WithSummary("Deletes an energy");

        return endpointRouteBuilder;
    }
}