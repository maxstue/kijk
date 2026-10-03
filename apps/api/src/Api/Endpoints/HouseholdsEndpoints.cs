using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Households.ChangeMemberRole;
using Kijk.Application.Households.Delete;
using Kijk.Application.Households.GetMembers;
using Kijk.Application.Households.GetRoles;
using Kijk.Application.Households.Shared;
using Kijk.Application.Households.Update;
using Kijk.Domain.Authorization;
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
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/roles", GetRoles)
            .WithoutHouseholdPermission("The fixed role catalog is the same for every household.")
            .WithSummary("Gets the household roles and their permissions");
        group.MapPut("/{id:guid}", Update)
            .RequireRouteHouseholdPermission(HouseholdPermissions.Household.Configure)
            .WithRequestValidation<UpdateHouseholdRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Updates household details");
        group.MapDelete("/{id:guid}", Delete)
            .RequireRouteHouseholdPermission(HouseholdPermissions.Household.Delete)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Deletes a household and its data");
        group.MapGet("/{id:guid}/members", GetMembers)
            .RequireRouteHouseholdPermission(HouseholdPermissions.Members.View)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Gets the members of a household with their roles");
        group.MapPut("/{id:guid}/members/{userId:guid}/role", ChangeMemberRole)
            .RequireRouteHouseholdPermission(HouseholdPermissions.Members.AssignRole)
            .WithRequestValidation<ChangeMemberRoleRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Changes the role of another household member");

        return builder;
    }

    private static async Task<Results<Ok<IReadOnlyList<HouseholdRoleResponse>>, ProblemHttpResult>> GetRoles(
        GetHouseholdRolesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<IReadOnlyList<HouseholdMemberResponse>>, ProblemHttpResult>> GetMembers(
        Guid id,
        GetHouseholdMembersHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<HouseholdMemberResponse>, ProblemHttpResult>> ChangeMemberRole(
        Guid id,
        Guid userId,
        ChangeMemberRoleRequest request,
        ChangeMemberRoleHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.ChangeAsync(id, userId, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
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