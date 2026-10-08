using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.Create;
using Kijk.Application.Transactions.Delete;
using Kijk.Application.Transactions.Export;
using Kijk.Application.Transactions.Get;
using Kijk.Application.Transactions.Shared;
using Kijk.Application.Transactions.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

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

        group.MapGet("/", GetAll).RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets a page of transactions of the active space, optionally by year, month, categories or without category");
        group.MapGet("/export", Export).RequireSpacePermission(SpacePermissions.Finances.Export).WithSummary("Exports transactions as CSV, optionally by year, month, categories or without category");
        group.MapGet("/{id:guid}", GetById).RequireSpacePermission(SpacePermissions.Finances.View).WithName("GetTransactionById").WithSummary("Gets a transaction by id");
        group.MapPost("/", Create).RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<CreateTransactionRequest>().WithSummary("Records a transaction manually");
        group.MapPut("/{id:guid}", Update).RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<UpdateTransactionRequest>().WithSummary("Updates a transaction");
        group.MapPut("/category", CategorizeMany).RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<CategorizeTransactionsRequest>().WithSummary("Assigns one category to several transactions");
        group.MapPut("/{id:guid}/category", Categorize).RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Corrects the category of a transaction, optionally remembering it for the merchant or counterparty");
        group.MapDelete("/{id:guid}", Delete).RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Deletes a transaction");

        return builder;
    }

    private static async Task<Results<Ok<TransactionPageResponse>, ProblemHttpResult>> GetAll(
        int? year,
        int? month,
        bool? uncategorized,
        [FromQuery] Guid[]? categoryIds,
        int? page,
        int? pageSize,
        GetTransactionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetPageAsync(
            new TransactionFilter(year, month, uncategorized, categoryIds),
            page ?? 1,
            pageSize ?? GetTransactionsHandler.DefaultPageSize,
            cancellationToken);
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

    private static async Task<Results<FileContentHttpResult, ProblemHttpResult>> Export(
        int? year,
        int? month,
        bool? uncategorized,
        [FromQuery] Guid[]? categoryIds,
        ExportTransactionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.ExportAsync(new TransactionFilter(year, month, uncategorized, categoryIds), cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.File(result.Value.Content, "text/csv; charset=utf-8", result.Value.FileName);
    }
}