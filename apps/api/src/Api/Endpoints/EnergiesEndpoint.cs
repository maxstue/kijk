using Kijk.Api.Modules.Energies;

namespace Kijk.Api.Endpoints;

public static class EnergiesEndpoint
{
    public static IEndpointRouteBuilder MapEnergyConsumptionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/energies")
            .WithTags("Energies");

        group.MapGetByEnergy()
            .MapGetByIdEnergy()
            .MapCreateEnergy()
            .MapUpdateEnergy()
            .MapDeleteEnergy();

        return endpointRouteBuilder;
    }
}