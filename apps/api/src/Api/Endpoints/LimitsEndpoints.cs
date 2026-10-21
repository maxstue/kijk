using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Limits.Create;
using Kijk.Application.Limits.Delete;
using Kijk.Application.Limits.Queries;
using Kijk.Application.Limits.Shared;
using Kijk.Application.Limits.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for consumption limits.
/// </summary>
public sealed class LimitsEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapSpaceGroup("limits")
            .WithTags("Consumption Limits")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", List).WithName("Limits.List").RequireSpacePermission(SpacePermissions.Limits.View).WithSummary("Gets consumption limits for the active space");
        group.MapGet("/{id:guid}", Details).WithName("Limits.Details").RequireSpacePermission(SpacePermissions.Limits.View).WithSummary("Gets a consumption limit by id");
        group.MapPost("/", Create).WithName("Limits.Create").RequireSpacePermission(SpacePermissions.Limits.Plan).WithRequestValidation<CreateLimitRequest>().WithSummary("Creates a consumption limit");
        group.MapPut("/{id:guid}", Update).WithName("Limits.Update").RequireSpacePermission(SpacePermissions.Limits.Plan).WithRequestValidation<UpdateLimitRequest>().WithSummary("Updates a consumption limit");
        group.MapDelete("/{id:guid}", Delete).WithName("Limits.Delete").RequireSpacePermission(SpacePermissions.Limits.Plan).WithSummary("Deletes a consumption limit");

        return builder;
    }

    private static async Task<Results<Ok<List<LimitResponse>>, ProblemHttpResult>> List(
        QueriesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.ListAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<LimitResponse>, ProblemHttpResult>> Details(
        Guid id,
        QueriesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.DetailsAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<CreatedAtRoute<LimitResponse>, ProblemHttpResult>> Create(
        CreateLimitRequest request,
        CreateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "Limits.Details", new { id = result.Value.Id });
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(
        Guid id,
        DeleteHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<LimitResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateLimitRequest request,
        UpdateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}