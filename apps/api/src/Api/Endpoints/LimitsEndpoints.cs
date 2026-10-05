using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Limits.Create;
using Kijk.Application.Limits.Get;
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
        var group = builder.MapGroup("limits")
            .WithTags("Consumption Limits")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireHouseholdPermission(HouseholdPermissions.Limits.View).WithSummary("Gets consumption limits for the active household");
        group.MapGet("/{id:guid}", GetById).RequireHouseholdPermission(HouseholdPermissions.Limits.View).WithName("GetLimitById").WithSummary("Gets a consumption limit by id");
        group.MapPost("/", Create).RequireHouseholdPermission(HouseholdPermissions.Limits.Plan).WithRequestValidation<CreateLimitRequest>().WithSummary("Creates a consumption limit");
        group.MapPut("/{id:guid}", Update).RequireHouseholdPermission(HouseholdPermissions.Limits.Plan).WithRequestValidation<UpdateLimitRequest>().WithSummary("Updates a consumption limit");

        return builder;
    }

    private static async Task<Results<Ok<List<LimitResponse>>, ProblemHttpResult>> GetAll(
        GetLimitsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<LimitResponse>, ProblemHttpResult>> GetById(
        Guid id,
        GetLimitsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetByIdAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<CreatedAtRoute<LimitResponse>, ProblemHttpResult>> Create(
        CreateLimitRequest request,
        CreateLimitHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "GetLimitById", new { id = result.Value.Id });
    }

    private static async Task<Results<Ok<LimitResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateLimitRequest request,
        UpdateLimitHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}