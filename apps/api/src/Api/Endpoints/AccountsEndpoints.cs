using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Accounts.Create;
using Kijk.Application.Accounts.Delete;
using Kijk.Application.Accounts.List;
using Kijk.Application.Accounts.Shared;
using Kijk.Application.Accounts.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for transaction accounts.
/// </summary>
public sealed class AccountsEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapSpaceGroup("accounts")
            .WithTags("Accounts")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", List).WithName("Accounts.List").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets the accounts of the active space");
        group.MapPost("/", Create).WithName("Accounts.Create").RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<CreateAccountRequest>().WithSummary("Creates an account; shared accounts additionally require finances:configure");
        group.MapPut("/{id:guid}", Update).WithName("Accounts.Update").RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<UpdateAccountRequest>().WithSummary("Updates an account; shared accounts additionally require finances:configure");
        group.MapDelete("/{id:guid}", Delete).WithName("Accounts.Delete").RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Deletes an account without transactions; shared accounts additionally require finances:configure");

        return builder;
    }

    private static async Task<Results<Ok<List<AccountResponse>>, ProblemHttpResult>> List(ListHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AccountResponse>, ProblemHttpResult>> Create(
        CreateAccountRequest request,
        CreateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AccountResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateAccountRequest request,
        UpdateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}