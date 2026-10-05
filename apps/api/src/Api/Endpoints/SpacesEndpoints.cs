using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.Delete;
using Kijk.Application.Spaces.GetMembers;
using Kijk.Application.Spaces.GetRoles;
using Kijk.Application.Spaces.Shared;
using Kijk.Application.Spaces.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for space settings.
/// </summary>
public sealed class SpacesEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/spaces")
            .WithTags("Spaces")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/roles", GetRoles)
            .WithoutSpacePermission("The fixed role catalog is the same for every space.")
            .WithSummary("Gets the space roles and their permissions");
        group.MapPut("/{id:guid}", Update)
            .RequireRouteSpacePermission(SpacePermissions.Space.Configure)
            .WithRequestValidation<UpdateSpaceRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Updates space details");
        group.MapDelete("/{id:guid}", Delete)
            .RequireRouteSpacePermission(SpacePermissions.Space.Delete)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Deletes a space and its data");
        group.MapGet("/{id:guid}/members", GetMembers)
            .RequireRouteSpacePermission(SpacePermissions.Members.View)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Gets the members of a space with their roles");
        group.MapPut("/{id:guid}/members/{userId:guid}/role", ChangeMemberRole)
            .RequireRouteSpacePermission(SpacePermissions.Members.AssignRole)
            .WithRequestValidation<ChangeMemberRoleRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Changes the role of another space member");

        return builder;
    }

    private static async Task<Results<Ok<IReadOnlyList<SpaceRoleResponse>>, ProblemHttpResult>> GetRoles(
        GetSpaceRolesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<IReadOnlyList<SpaceMemberResponse>>, ProblemHttpResult>> GetMembers(
        Guid id,
        GetSpaceMembersHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<SpaceMemberResponse>, ProblemHttpResult>> ChangeMemberRole(
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
        UpdateSpaceRequest request,
        UpdateSpaceHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(
        Guid id,
        DeleteSpaceHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}