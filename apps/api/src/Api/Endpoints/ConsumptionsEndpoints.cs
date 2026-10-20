using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Consumptions.Delete;
using Kijk.Application.Consumptions.Details;
using Kijk.Application.Consumptions.Export;
using Kijk.Application.Consumptions.List;
using Kijk.Application.Consumptions.Record;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Consumptions.Statistics;
using Kijk.Application.Consumptions.Update;
using Kijk.Application.Consumptions.Years;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for consumptions.
/// </summary>
public class ConsumptionsEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapSpaceGroup("consumptions")
            .WithTags("Consumptions")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/{id:guid}", Details).WithName("Consumptions.Details")

            .RequireSpacePermission(SpacePermissions.Consumptions.View)
            .WithSummary("Gets a consumption by id");

        group.MapGet("/{id:guid}/export", Export).WithName("Consumptions.Export")
            .RequireSpacePermission(SpacePermissions.Consumptions.Export)
            .WithSummary("Exports a consumption as CSV")
            .Produces<byte[]>(StatusCodes.Status200OK, contentType: "text/csv")
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/export", ExportMonth).WithName("Consumptions.ExportMonth")
            .RequireSpacePermission(SpacePermissions.Consumptions.Export)
            .WithSummary("Exports all consumptions for a month as CSV")
            .Produces<byte[]>(StatusCodes.Status200OK, contentType: "text/csv")
            .ProducesValidationProblem();

        group.MapGet("/", List).WithName("Consumptions.List")
            .RequireSpacePermission(SpacePermissions.Consumptions.View)
            .WithSummary("Gets all consumptions for the current user by year, month and type");

        group.MapGet("/statistics", Statistics).WithName("Consumptions.Statistics")
            .RequireSpacePermission(SpacePermissions.Consumptions.View)
            .WithSummary("Gets all consumptions stats");

        group.MapGet("/years", Years).WithName("Consumptions.Years")
            .RequireSpacePermission(SpacePermissions.Consumptions.View)
            .WithSummary("Gets all years");

        group.MapPost("/", Record).WithName("Consumptions.Record")
            .RequireSpacePermission(SpacePermissions.Consumptions.Record)
            .WithRequestValidation<CreateConsumptionRequest>()
            .WithSummary("Creates a new consumption");

        group.MapPut("/{id:guid}", Update).WithName("Consumptions.Update")
            .RequireSpacePermission(SpacePermissions.Consumptions.Record)
            .WithRequestValidation<UpdateConsumptionRequest>()
            .WithSummary("Updates a consumption");

        group.MapDelete("/{id:guid}", Delete).WithName("Consumptions.Delete")
            .RequireSpacePermission(SpacePermissions.Consumptions.Record)
            .WithSummary("Deletes a consumption");

        return builder;
    }

    /// <summary>
    /// Gets a consumption by id.
    /// </summary>
    /// <param name="id">The consumption id.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> Details(Guid id, DetailsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Exports a consumption as CSV.
    /// </summary>
    private static async Task<Results<FileContentHttpResult, ProblemHttpResult>> Export(
        Guid id,
        ExportHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.File(result.Value.Content, "text/csv; charset=utf-8", result.Value.FileName);
    }

    /// <summary>
    /// Exports all consumptions for a month as CSV.
    /// </summary>
    private static async Task<Results<FileContentHttpResult, ProblemHttpResult>> ExportMonth(
        [FromQuery] int year,
        [FromQuery] string month,
        ExportHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.MonthAsync(year, month, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.File(result.Value.Content, "text/csv; charset=utf-8", result.Value.FileName);
    }

    /// <summary>
    /// Gets all consumptions for the current user by year, month and type.
    /// </summary>
    /// <param name="year">The year, or all years when omitted.</param>
    /// <param name="month">The English month name, or all months when omitted.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<List<ConsumptionResponse>>, ProblemHttpResult>> List(int? year, string? month, ListHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Gets all consumption statistics.
    /// </summary>
    /// <param name="year">The year, or all years when omitted.</param>
    /// <param name="month">The English month name, or all months when omitted.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<GetStatsConsumptionsResponseWrapper>, ProblemHttpResult>> Statistics([FromQuery] int year, [FromQuery] string month, StatisticsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Retrieves all years that have consumption usages and all years in between.
    /// </summary>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<GetYearsConsumptionQueryResponse>, ProblemHttpResult>> Years(YearsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Creates a new consumption usage.
    /// The value can be an absolute value or a relative value.
    /// If the value type is relative, the value will be calculated based on the last consumption
    /// </summary>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<CreatedAtRoute<ConsumptionResponse>, ProblemHttpResult>> Record(CreateConsumptionRequest request,
        RecordHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "Consumptions.Details", new { id = result.Value.Id });
    }

    /// <summary>
    /// Updates an consumption usage.
    /// </summary>
    /// <param name="id">The consumption id.</param>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> Update(Guid id, UpdateConsumptionRequest request, UpdateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Deletes an consumption usage.
    /// </summary>
    /// <param name="id">The consumption id.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}