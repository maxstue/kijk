using Kijk.Api.Extensions;
using Kijk.Application.Consumptions;
using Kijk.Shared;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for consumptions.
/// </summary>
public class ConsumptionsEndpoints : IEndpointGroup
{
    // TODO return proper http result with only id of created entity
    // TODO return Result<> from handler and than map it into a Http-TypedResult in the endpoint
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("consumptions")
            .WithTags("Consumptions");

        group.MapGet("{id:guid}", GetByIdConsumptionHandler.HandleAsync)
            .WithSummary("Gets a consumption by id");

        group.MapGet("", GetByYearMonthHandler.HandleAsync)
            .WithSummary("Gets all consumptions for the current user by year, month and type");

        group.MapGet("stats", GetStatsConsumptionsHandler.HandleAsync)
            .WithSummary("Gets all consumptions stats");

        group.MapGet("years", GetYearsConsumptionHandler.HandleAsync)
            .WithSummary("Gets all years");

        group.MapPost("", CreateConsumptionHandler.HandleAsync)
            .WithRequestValidation<CreateConsumptionRequest>()
            .WithSummary("Creates a new consumption");

        group.MapPut("{id:guid}", UpdateConsumptionHandler.HandleAsync)
            .WithSummary("Updates a consumption");

        group.MapDelete("{id:guid}", DeleteConsumptionHandler.HandleAsync)
            .WithSummary("Deletes a consumption");

        return builder;
    }
}