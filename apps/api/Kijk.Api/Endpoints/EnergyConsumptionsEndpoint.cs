namespace Kijk.Api.Endpoints;

public static class EnergyConsumptionsEndpoint
{
    public static IEndpointRouteBuilder MaEnergyConsumptionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/energy-consumptions")
            .WithTags("EnergyConsumptions");



        return endpointRouteBuilder;
    }
}