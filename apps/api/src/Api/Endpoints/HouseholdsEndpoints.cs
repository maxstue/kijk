using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Households.Delete;
using Kijk.Application.Households.Update;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for household settings.
/// </summary>
public sealed class HouseholdsEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/households")
            .WithTags("Households")
            .RequireAuthorization(AppConstants.Roles.User)
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapPut("/{id:guid}", Update)
            .WithRequestValidation<UpdateHouseholdRequest>()
            .WithSummary("Updates household details");
        group.MapDelete("/{id:guid}", Delete)
            .WithSummary("Deletes a household and its data");

        return builder;
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Update(
        Guid id,
        UpdateHouseholdRequest request,
        UpdateHouseholdHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(
        Guid id,
        DeleteHouseholdHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}