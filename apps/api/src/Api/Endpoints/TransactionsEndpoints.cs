using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.Create;
using Kijk.Application.Transactions.Delete;
using Kijk.Application.Transactions.Get;
using Kijk.Application.Transactions.Shared;
using Kijk.Application.Transactions.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for transactions.
/// </summary>
public sealed class TransactionsEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("transactions")
            .WithTags("Transactions")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Gets transactions of the active household, optionally by year, month or without category");
        group.MapGet("/{id:guid}", GetById).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithName("GetTransactionById").WithSummary("Gets a transaction by id");
        group.MapPost("/", Create).RequireHouseholdPermission(HouseholdPermissions.Finances.Record).WithRequestValidation<CreateTransactionRequest>().WithSummary("Records a transaction manually");
        group.MapPut("/{id:guid}", Update).RequireHouseholdPermission(HouseholdPermissions.Finances.Record).WithRequestValidation<UpdateTransactionRequest>().WithSummary("Updates a transaction");
        group.MapPut("/category", CategorizeMany).RequireHouseholdPermission(HouseholdPermissions.Finances.Record).WithRequestValidation<CategorizeTransactionsRequest>().WithSummary("Assigns one category to several transactions");
        group.MapPut("/{id:guid}/category", Categorize).RequireHouseholdPermission(HouseholdPermissions.Finances.Record).WithSummary("Corrects the category of a transaction, optionally remembering it for the merchant or counterparty");
        group.MapDelete("/{id:guid}", Delete).RequireHouseholdPermission(HouseholdPermissions.Finances.Record).WithSummary("Deletes a transaction");

        return builder;
    }

    private static async Task<Results<Ok<List<TransactionResponse>>, ProblemHttpResult>> GetAll(
        int? year,
        int? month,
        bool? uncategorized,
        GetTransactionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(year, month, uncategorized, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<TransactionResponse>, ProblemHttpResult>> GetById(
        Guid id,
        GetTransactionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetByIdAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<CreatedAtRoute<TransactionResponse>, ProblemHttpResult>> Create(
        CreateTransactionRequest request,
        CreateTransactionHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "GetTransactionById", new { id = result.Value.Id });
    }

    private static async Task<Results<Ok<TransactionResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateTransactionRequest request,
        UpdateTransactionHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategorizeTransactionResponse>, ProblemHttpResult>> Categorize(
        Guid id,
        CategorizeTransactionRequest request,
        CategorizeTransactionHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CategorizeAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategorizeTransactionsResponse>, ProblemHttpResult>> CategorizeMany(
        CategorizeTransactionsRequest request,
        CategorizeTransactionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CategorizeAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteTransactionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}