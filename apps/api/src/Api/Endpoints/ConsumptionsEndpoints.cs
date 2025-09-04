using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Consumptions;
using Kijk.Application.Consumptions.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for consumptions.
/// </summary>
public class ConsumptionsEndpoints : IEndpointGroup
{
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("consumptions")
            .WithTags("Consumptions");

        group.MapGet("/{id:guid}", async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> (Guid id, GetByIdConsumptionHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.GetByIdAsync(id, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Gets a consumption by id");

        group.MapGet("/",
                async Task<Results<Ok<List<ConsumptionResponse>>, ProblemHttpResult>> ([FromQuery] int? year, [FromQuery] string? month, GetByYearMonthHandler handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.GetByYearMonthAsync(year, month, cancellationToken);
                    return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
                })
            .WithSummary("Gets all consumptions for the current user by year, month and type");

        group.MapGet("/stats",
                async Task<Results<Ok<GetStatsConsumptionsResponseWrapper>, ProblemHttpResult>> ([FromQuery] int year, [FromQuery] string month, GetStatsConsumptionsHandler handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.GetStatsAsync(year, month, cancellationToken);
                    return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
                })
            .WithSummary("Gets all consumptions stats");

        group.MapGet("/years", async Task<Results<Ok<GetYearsConsumptionQueryResponse>, ProblemHttpResult>> (GetYearsConsumptionHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.GetYearsAsync(cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Gets all years");

        group.MapPost("/", async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> ([FromBody] CreateConsumptionRequest request, CreateConsumptionHandler handler,
                CancellationToken cancellationToken) =>
            {
                var result = await handler.CreateAsync(request, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithRequestValidation<CreateConsumptionRequest>()
            .WithSummary("Creates a new consumption");

        group.MapPut("/{id:guid}",
                async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> (Guid id, [FromBody] UpdateConsumptionRequest request, UpdateConsumptionHandler handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.UpdateAsync(id, request, cancellationToken);
                    return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
                })
            .WithSummary("Updates a consumption");

        group.MapDelete("/{id:guid}", async Task<Results<Ok<bool>, ProblemHttpResult>> (Guid id, DeleteConsumptionHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.DeleteAsync(id, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Deletes a consumption");

        return builder;
    }
}