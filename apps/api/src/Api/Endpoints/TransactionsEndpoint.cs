using Kijk.Api.Common.Extensions;
using Kijk.Application.Transactions.Endpoints;
using Kijk.Application.Transactions.Models;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for transactions.
/// </summary>
public static class TransactionsEndpoint
{
    public static IEndpointRouteBuilder MapTransactionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/transactions")
            .WithTags("Transactions");

        group.MapGet("/", GetByTransactions.HandleAsync)
            .WithTags("Retrieves transactions");

        group.MapGet("/{id:guid}", GetByIdTransaction.HandleAsync)
            .WithSummary("Gets transaction by id");

        group.MapGet("/years", GetYearsFromTransactions.HandleAsync)
            .WithSummary("Get all years from transactions");

        group.MapPost("/", CreateTransaction.HandleAsync)
            .WithRequestValidation<CreateTransactionRequest>()
            .WithTags("Create a new transaction");

        group.MapPut("/{id:guid}", UpdateTransaction.HandleAsync)
            .WithSummary("Update a transaction");

        group.MapDelete("/{id:guid}", DeleteTransaction.HandleAsync)
            .WithSummary("Delete a transaction");

        return endpointRouteBuilder;
    }
}