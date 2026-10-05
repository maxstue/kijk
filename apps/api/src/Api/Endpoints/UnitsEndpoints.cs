using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Units.Create;
using Kijk.Application.Units.GetAll;
using Kijk.Application.Units.Manage;
using Kijk.Application.Units.Shared;
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

        group.MapGet("", GetAll).WithoutSpacePermission(UserOwned).WithSummary("Gets units visible to the current user");
        group.MapGet("/system", GetSystem).WithoutSpacePermission("System units are public reference data.").WithSummary("Gets supported system units");
        group.MapGet("/page", GetPage).WithoutSpacePermission(UserOwned).WithSummary("Gets a page of units for settings");
        group.MapPost("", Create).WithoutSpacePermission("Creates a unit owned by the current user; sharing it with spaces is checked in the handler (units:share).").WithRequestValidation<CreateUnitRequest>().WithSummary("Creates a user unit");
        group.MapPut("/{id:guid}", Update).WithoutSpacePermission(UserOwned).WithRequestValidation<UpdateUnitRequest>().WithSummary("Updates a user unit");
        group.MapPost("/{id:guid}/archive", Archive).WithoutSpacePermission(UserOwned).WithSummary("Archives a user unit");
        group.MapPost("/{id:guid}/restore", Restore).WithoutSpacePermission(UserOwned).WithSummary("Restores a user unit");
        group.MapPut("/{id:guid}/spaces/{spaceId:guid}", Share).RequireRouteSpacePermission(SpacePermissions.Units.Share).WithSummary("Shares a unit with a space");
        group.MapDelete("/{id:guid}/spaces/{spaceId:guid}", Unshare).RequireRouteSpacePermission(SpacePermissions.Units.Share).WithSummary("Removes a unit from a space");
        group.MapDelete("/{id:guid}", Delete).WithoutSpacePermission(UserOwned).WithSummary("Deletes an unused user unit");
        return builder;
    }

    private static async Task<Results<Ok<List<UnitResponse>>, ProblemHttpResult>> GetAll(
        bool includeArchived,
        GetAllUnitsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(includeArchived, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<UnitResponse>>, ProblemHttpResult>> GetSystem(
        GetAllUnitsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetSystemAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<UnitPageResponse>, ProblemHttpResult>> GetPage(
        bool space, Guid? spaceId, int page, int pageSize, string? search,
        GetAllUnitsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetPageAsync(space, spaceId, page, pageSize, search, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Created<UnitResponse>, ProblemHttpResult>> Create(
        CreateUnitRequest request,
        CreateUnitHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.Created($"/units/{result.Value.Id}", result.Value);
    }

    private static async Task<Results<Ok<UnitResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateUnitRequest request,
        UpdateUnitHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static Task<Results<NoContent, ProblemHttpResult>> Archive(Guid id, ManageUnitHandler handler, CancellationToken cancellationToken) =>
        Manage(id, handler, static (service, unitId, token) => service.ArchiveAsync(unitId, true, token), cancellationToken);

    private static Task<Results<NoContent, ProblemHttpResult>> Restore(Guid id, ManageUnitHandler handler, CancellationToken cancellationToken) =>
        Manage(id, handler, static (service, unitId, token) => service.ArchiveAsync(unitId, false, token), cancellationToken);

    private static async Task<Results<NoContent, ProblemHttpResult>> Share(Guid id, Guid spaceId, ManageUnitHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.ShareAsync(id, spaceId, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Unshare(Guid id, Guid spaceId, ManageUnitHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.UnshareAsync(id, spaceId, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, ManageUnitHandler handler, CancellationToken cancellationToken) =>
        Manage(id, handler, static (service, unitId, token) => service.DeleteAsync(unitId, token), cancellationToken);

    private static async Task<Results<NoContent, ProblemHttpResult>> Manage(
        Guid id,
        ManageUnitHandler handler,
        Func<ManageUnitHandler, Guid, CancellationToken, Task<Result<bool>>> action,
        CancellationToken cancellationToken)
    {
        var result = await action(handler, id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}