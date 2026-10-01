using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.ConsumptionLimits.Create;
using Kijk.Application.ConsumptionLimits.Get;
using Kijk.Application.ConsumptionLimits.Shared;
using Kijk.Application.ConsumptionLimits.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for consumption limits.
/// </summary>
public sealed class ConsumptionLimitsEndpoints : IEndpointGroup
{
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("consumption-limits")
            .WithTags("Consumption Limits")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireHouseholdPermission(HouseholdPermissions.Limits.View).WithSummary("Gets consumption limits for the active household");
        group.MapGet("/{id:guid}", GetById).RequireHouseholdPermission(HouseholdPermissions.Limits.View).WithName("GetConsumptionLimitById").WithSummary("Gets a consumption limit by id");
        group.MapPost("/", Create).RequireHouseholdPermission(HouseholdPermissions.Limits.Plan).WithRequestValidation<CreateConsumptionLimitRequest>().WithSummary("Creates a consumption limit");
        group.MapPut("/{id:guid}", Update).RequireHouseholdPermission(HouseholdPermissions.Limits.Plan).WithRequestValidation<UpdateConsumptionLimitRequest>().WithSummary("Updates a consumption limit");

        return builder;
    }

    private static async Task<Results<Ok<List<ConsumptionLimitResponse>>, ProblemHttpResult>> GetAll(
        GetConsumptionLimitsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ConsumptionLimitResponse>, ProblemHttpResult>> GetById(
        Guid id,
        GetConsumptionLimitsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetByIdAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<CreatedAtRoute<ConsumptionLimitResponse>, ProblemHttpResult>> Create(
        CreateConsumptionLimitRequest request,
        CreateConsumptionLimitHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "GetConsumptionLimitById", new { id = result.Value.Id });
    }

    private static async Task<Results<Ok<ConsumptionLimitResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateConsumptionLimitRequest request,
        UpdateConsumptionLimitHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}