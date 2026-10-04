using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Accounts.Create;
using Kijk.Application.Accounts.Delete;
using Kijk.Application.Accounts.Get;
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
        var group = builder.MapGroup("accounts")
            .WithTags("Accounts")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Gets the accounts of the active household");
        group.MapPost("/", Create).RequireHouseholdPermission(HouseholdPermissions.Finances.Configure).WithRequestValidation<CreateAccountRequest>().WithSummary("Creates an account");
        group.MapPut("/{id:guid}", Update).RequireHouseholdPermission(HouseholdPermissions.Finances.Configure).WithRequestValidation<UpdateAccountRequest>().WithSummary("Updates an account");
        group.MapDelete("/{id:guid}", Delete).RequireHouseholdPermission(HouseholdPermissions.Finances.Configure).WithSummary("Deletes an account without transactions");

        return builder;
    }

    private static async Task<Results<Ok<List<AccountResponse>>, ProblemHttpResult>> GetAll(GetAccountsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AccountResponse>, ProblemHttpResult>> Create(
        CreateAccountRequest request,
        CreateAccountHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AccountResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateAccountRequest request,
        UpdateAccountHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteAccountHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}