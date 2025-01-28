using Kijk.Api.Modules.Energies;

namespace Kijk.Api.Endpoints;

public static class EnergiesEndpoint
{
    public static IEndpointRouteBuilder MapEnergyConsumptionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/energies")
            .WithTags("Energies");

        group.MapGetByEnergy()
            .MapGetYearsFromEnergies()
            .MapGetByIdEnergy()
            .MapGetStatsEnergy()
            .MapCreateEnergy()
            .MapUpdateEnergy()
            .MapDeleteEnergy();

        return endpointRouteBuilder;
    }
}