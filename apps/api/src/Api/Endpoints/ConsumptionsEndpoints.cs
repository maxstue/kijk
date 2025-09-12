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

        group.MapGet("/{id:guid}", GetById)
            .WithSummary("Gets a consumption by id");

        group.MapGet("/", GetByYearMonth)
            .WithSummary("Gets all consumptions for the current user by year, month and type");

        group.MapGet("/stats", GetStats)
            .WithSummary("Gets all consumptions stats");

        group.MapGet("/years", GetYears)
            .WithSummary("Gets all years");

        group.MapPost("/", Create)
            .WithRequestValidation<CreateConsumptionRequest>()
            .WithSummary("Creates a new consumption");

        group.MapPut("/{id:guid}", Update)
            .WithSummary("Updates a consumption");

        group.MapDelete("/{id:guid}", Delete)
            .WithSummary("Deletes a consumption");

        return builder;
    }

    /// <summary>
    /// Gets a consumption by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> GetById(Guid id, GetByIdConsumptionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetByIdAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Gets all consumptions for the current user by year, month and type.
    /// </summary>
    /// <param name="year"></param>
    /// <param name="month"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<List<ConsumptionResponse>>, ProblemHttpResult>> GetByYearMonth(int? year, string? month, GetByYearMonthHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetByYearMonthAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Gets all consumption statistics.
    /// </summary>
    /// <param name="year"></param>
    /// <param name="month"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<GetStatsConsumptionsResponseWrapper>, ProblemHttpResult>> GetStats([FromQuery] int year, [FromQuery] string month, GetStatsConsumptionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetStatsAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Retrieves all years that have consumption usages and all years in between.
    /// </summary>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<GetYearsConsumptionQueryResponse>, ProblemHttpResult>> GetYears(GetYearsConsumptionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetYearsAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Creates a new consumption usage.
    /// The value can be an absolute value or a relative value.
    /// If the value type is relative, the value will be calculated based on the last consumption
    /// </summary>
    /// <param name="request"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> Create(CreateConsumptionRequest request, CreateConsumptionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Updates an consumption usage.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="request"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> Update(Guid id, UpdateConsumptionRequest request, UpdateConsumptionHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Deletes an consumption usage.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<bool>, ProblemHttpResult>> Delete(Guid id, DeleteConsumptionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}