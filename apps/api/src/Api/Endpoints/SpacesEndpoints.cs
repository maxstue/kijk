using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.Create;
using Kijk.Application.Spaces.CreateInvitation;
using Kijk.Application.Spaces.Delete;
using Kijk.Application.Spaces.Invitations;
using Kijk.Application.Spaces.Members;
using Kijk.Application.Spaces.RevokeInvitation;
using Kijk.Application.Spaces.Roles;
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

        group.MapGet("/roles", Roles).WithName("Spaces.Roles")
            .WithoutSpacePermission("The fixed role catalog is the same for every space.")
            .WithSummary("Gets the space roles and their permissions");
        group.MapPost("/", Create).WithName("Spaces.Create")
            .WithoutSpacePermission("The space does not exist yet; every user may create shared spaces and becomes their admin.")
            .WithRequestValidation<CreateSpaceRequest>()
            .WithSummary("Creates a shared space with the current user as admin");
        group.MapPut("/{id:guid}", Update).WithName("Spaces.Update")
            .RequireRouteSpacePermission(SpacePermissions.Space.Configure)
            .WithRequestValidation<UpdateSpaceRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Updates space details");
        group.MapDelete("/{id:guid}", Delete).WithName("Spaces.Delete")
            .RequireRouteSpacePermission(SpacePermissions.Space.Delete)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Deletes a space and its data");
        group.MapGet("/{id:guid}/members", Members).WithName("Spaces.Members")
            .RequireRouteSpacePermission(SpacePermissions.Members.View)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Gets the members of a space with their roles");
        group.MapPut("/{id:guid}/members/{userId:guid}/role", ChangeMemberRole).WithName("Spaces.ChangeMemberRole")
            .RequireRouteSpacePermission(SpacePermissions.Members.AssignRole)
            .WithRequestValidation<ChangeMemberRoleRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Changes the role of another space member");
        group.MapPost("/{id:guid}/invitations", CreateInvitation).WithName("Spaces.CreateInvitation")
            .RequireRouteSpacePermission(SpacePermissions.Members.Invite)
            .WithRequestValidation<CreateSpaceInvitationRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests)
            .RequireRateLimiting(AppConstants.InvitationRateLimit)
            .WithSummary("Invites a person into a shared space by unique name or e-mail address");
        group.MapGet("/{id:guid}/invitations", Invitations).WithName("Spaces.Invitations")
            .RequireRouteSpacePermission(SpacePermissions.Members.Invite)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Gets the pending invitations of a space");
        group.MapDelete("/{id:guid}/invitations/{invitationId:guid}", RevokeInvitation).WithName("Spaces.RevokeInvitation")
            .RequireRouteSpacePermission(SpacePermissions.Members.Invite)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .WithSummary("Revokes a pending invitation");
        return builder;
    }

    private static async Task<Results<Ok<IReadOnlyList<SpaceRoleResponse>>, ProblemHttpResult>> Roles(
        RolesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CreateSpaceResponse>, ProblemHttpResult>> Create(
        CreateSpaceRequest request,
        CreateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<IReadOnlyList<SpaceMemberResponse>>, ProblemHttpResult>> Members(
        Guid id,
        MembersHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<SpaceMemberResponse>, ProblemHttpResult>> ChangeMemberRole(
        Guid id,
        Guid userId,
        ChangeMemberRoleRequest request,
        ChangeMemberRoleHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, userId, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<SpaceInvitationResponse>, ProblemHttpResult>> CreateInvitation(
        Guid id,
        CreateSpaceInvitationRequest request,
        CreateInvitationHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<IReadOnlyList<SpaceInvitationResponse>>, ProblemHttpResult>> Invitations(
        Guid id,
        InvitationsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> RevokeInvitation(
        Guid id,
        Guid invitationId,
        RevokeInvitationHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, invitationId, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Update(
        Guid id,
        UpdateSpaceRequest request,
        UpdateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(
        Guid id,
        DeleteHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}