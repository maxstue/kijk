using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Units.Archive;
using Kijk.Application.Units.Create;
using Kijk.Application.Units.Delete;
using Kijk.Application.Units.List;
using Kijk.Application.Units.RemoveFromSpace;
using Kijk.Application.Units.Restore;
using Kijk.Application.Units.Shared;
using Kijk.Application.Units.ShareWithSpace;
using Kijk.Application.Units.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for reusable system and user units.
/// </summary>
public sealed class UnitsEndpoints : IEndpointGroup
{
    private const string UserOwned = "Units are owned by the current user; the handler scopes all queries to the user.";

    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/units")
            .WithTags("Units")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("", List).WithName("Units.List").WithoutSpacePermission("Lists system units, the user's own units, or the units of a space the user is a member of; the handler checks the membership.").WithSummary("Gets the units of a scope, optionally filtered and paged");
        group.MapPost("", Create).WithName("Units.Create").WithoutSpacePermission("Creates a unit owned by the current user; sharing it with spaces is checked in the handler (units:share).").WithRequestValidation<CreateUnitRequest>().WithSummary("Creates a user unit");
        group.MapPut("/{id:guid}", Update).WithName("Units.Update").WithoutSpacePermission(UserOwned).WithRequestValidation<UpdateUnitRequest>().WithSummary("Updates a user unit");
        group.MapPost("/{id:guid}/archive", Archive).WithName("Units.Archive").WithoutSpacePermission(UserOwned).WithSummary("Archives a user unit");
        group.MapPost("/{id:guid}/restore", Restore).WithName("Units.Restore").WithoutSpacePermission(UserOwned).WithSummary("Restores a user unit");
        group.MapPut("/{id:guid}/spaces/{spaceId:guid}", ShareWithSpace).WithName("Units.ShareWithSpace").RequireRouteSpacePermission(SpacePermissions.Units.Share).WithSummary("Shares a unit with a space");
        group.MapDelete("/{id:guid}/spaces/{spaceId:guid}", RemoveFromSpace).WithName("Units.RemoveFromSpace").RequireRouteSpacePermission(SpacePermissions.Units.Share).WithSummary("Removes a unit from a space");
        group.MapDelete("/{id:guid}", Delete).WithName("Units.Delete").WithoutSpacePermission(UserOwned).WithSummary("Deletes an unused user unit");
        return builder;
    }

    private static async Task<Results<Ok<UnitPageResponse>, ProblemHttpResult>> List(
        ListHandler handler,
        CancellationToken cancellationToken,
        UnitScope scope = UnitScope.Space,
        Guid? spaceId = null,
        bool includeArchived = false,
        string? search = null,
        int? page = null,
        int? pageSize = null)
    {
        var result = await handler.HandleAsync(new(scope, spaceId, includeArchived, search, page, pageSize), cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Created<UnitResponse>, ProblemHttpResult>> Create(
        CreateUnitRequest request,
        CreateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.Created($"/units/{result.Value.Id}", result.Value);
    }

    private static async Task<Results<Ok<UnitResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateUnitRequest request,
        UpdateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Archive(Guid id, ArchiveHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Restore(Guid id, RestoreHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> ShareWithSpace(Guid id, Guid spaceId, ShareWithSpaceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, spaceId, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> RemoveFromSpace(Guid id, Guid spaceId, RemoveFromSpaceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, spaceId, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}