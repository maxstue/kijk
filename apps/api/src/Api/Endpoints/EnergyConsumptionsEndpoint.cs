using Kijk.Api.Modules.EnergyConsumptions;

namespace Kijk.Api.Endpoints;

public static class EnergyConsumptionsEndpoint
{
    public static IEndpointRouteBuilder MapEnergyConsumptionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/energy-consumptions")
            .WithTags("EnergyConsumptions");

        group.MapGetByEnergyConsumptions()
            .MapGetByIdEnergyConsumption()
            .MapCreateEnergyConsumption()
            .MapUpdateEnergyConsumption()
            .MapDeleteEnergyConsumption();

        return endpointRouteBuilder;
    }
}