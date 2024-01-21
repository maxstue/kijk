using Kijk.Api.Application.Transactions;
using Kijk.Api.Common.Filters;
using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

public static class TransactionsEndpoint
{
    public static IEndpointRouteBuilder MapTransactionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/transactions");

        group.MapGet("/", GetBy);
        group.MapGet("/{id:guid}", GetById);
        group.MapPost("/", Create).AddEndpointFilter<ValidationFilter<CreateTransactionRequest>>();
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", DeleteById);

        group.MapGet("/years", GetYearsAsync);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> GetBy(
        TransactionsService service,
        [FromQuery(Name = "year")] int? year,
        [FromQuery(Name = "month")] string? month)
    {
        var result = await service.GetByAsync(year, month);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> GetById(TransactionsService service, Guid id, CancellationToken token)
    {
        var result = await service.GetByIdAsync(id, token);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> Create(
        TransactionsService service,
        [FromBody] CreateTransactionRequest transactionRequest,
        CancellationToken token)
    {
        var result = await service.CreateAsync(transactionRequest, token);
        return result.ToResponse("Successfully created", SuccessType.Created);
    }

    private static async Task<IResult> Update(
        TransactionsService service,
        Guid id,
        [FromBody] UpdateTransactionRequest transactionRequest,
        CancellationToken token)
    {
        var result = await service.UpdateAsync(id, transactionRequest, token);
        return result.ToResponse("Successfully updated");
    }

    private static async Task<IResult> DeleteById(TransactionsService service, Guid id, CancellationToken token)
    {
        var result = await service.DeleteAsync(id, token);
        return result.ToResponse("Successfully deleted");
    }

    /// <summary>
    ///     Retrieves all years that have transactions and all yeats in between.
    /// </summary>
    /// <param name="service">The transaction service </param>
    /// <returns>A list of years </returns>
    private static async Task<IResult> GetYearsAsync(TransactionsService service)
    {
        var result = await service.GetYearsAsync();
        return result.ToResponse("Successfully loaded");
    }
}
