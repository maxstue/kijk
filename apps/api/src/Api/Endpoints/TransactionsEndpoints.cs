using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.CategorizeMany;
using Kijk.Application.Transactions.Delete;
using Kijk.Application.Transactions.Export;
using Kijk.Application.Transactions.Queries;
using Kijk.Application.Transactions.Record;
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
        var group = builder.MapSpaceGroup("transactions")
            .WithTags("Transactions")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", List).WithName("Transactions.List").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets a page of transactions of the active space, optionally by year, month, categories or without category");
        group.MapGet("/export", Export).WithName("Transactions.Export").RequireSpacePermission(SpacePermissions.Finances.Export).WithSummary("Exports transactions as CSV, optionally by year, month, categories or without category");
        group.MapGet("/{id:guid}", Details).WithName("Transactions.Details").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets a transaction by id");
        group.MapPost("/", Record).WithName("Transactions.Record").RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<CreateTransactionRequest>().WithSummary("Records a transaction manually");
        group.MapPut("/{id:guid}", Update).WithName("Transactions.Update").RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<UpdateTransactionRequest>().WithSummary("Updates a transaction");
        group.MapPut("/category", CategorizeMany).WithName("Transactions.CategorizeMany").RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<CategorizeTransactionsRequest>().WithSummary("Assigns one category to several transactions");
        group.MapPut("/{id:guid}/category", Categorize).WithName("Transactions.Categorize").RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Corrects the category of a transaction, optionally remembering it for the merchant or counterparty");
        group.MapDelete("/{id:guid}", Delete).WithName("Transactions.Delete").RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Deletes a transaction");

        return builder;
    }

    private static async Task<Results<Ok<TransactionPageResponse>, ProblemHttpResult>> List(
        int? year,
        int? month,
        bool? uncategorized,
        [FromQuery] Guid[]? categoryIds,
        int? page,
        int? pageSize,
        QueriesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.ListAsync(
            new TransactionFilter(year, month, uncategorized, categoryIds),
            page ?? 1,
            pageSize ?? QueriesHandler.DefaultPageSize,
            cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<TransactionResponse>, ProblemHttpResult>> Details(
        Guid id,
        QueriesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.DetailsAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<CreatedAtRoute<TransactionResponse>, ProblemHttpResult>> Record(
        CreateTransactionRequest request,
        RecordHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "Transactions.Details", new { id = result.Value.Id });
    }

    private static async Task<Results<Ok<TransactionResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateTransactionRequest request,
        UpdateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategorizeTransactionResponse>, ProblemHttpResult>> Categorize(
        Guid id,
        CategorizeTransactionRequest request,
        CategorizeHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategorizeTransactionsResponse>, ProblemHttpResult>> CategorizeMany(
        CategorizeTransactionsRequest request,
        CategorizeManyHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<FileContentHttpResult, ProblemHttpResult>> Export(
        int? year,
        int? month,
        bool? uncategorized,
        [FromQuery] Guid[]? categoryIds,
        ExportHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new TransactionFilter(year, month, uncategorized, categoryIds), cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.File(result.Value.Content, "text/csv; charset=utf-8", result.Value.FileName);
    }
}