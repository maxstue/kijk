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

        return endpointRouteBuilder;
    }

    private static async Task<IResult> GetBy(
        ITransactionsService service,
        [FromQuery(Name = "year")] int? year,
        [FromQuery(Name = "month")] string? month)
    {
        var result = await service.GetByAsync(year, month);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> GetById(ITransactionsService service, Guid id, CancellationToken token)
    {
        var result = await service.GetByIdAsync(id, token);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> Create(
        ITransactionsService service,
        [FromBody] CreateTransactionRequest transactionRequest,
        CancellationToken token)
    {
        var result = await service.CreateAsync(transactionRequest, token);
        return result.ToResponse("Successfully created", SuccessType.Created);
    }

    private static async Task<IResult> Update(
        ITransactionsService service,
        Guid id,
        [FromBody] UpdateTransactionRequest transactionRequest,
        CancellationToken token)
    {
        var result = await service.UpdateAsync(id, transactionRequest, token);
        return result.ToResponse("Successfully updated");
    }

    private static async Task<IResult> DeleteById(ITransactionsService service, Guid id, CancellationToken token)
    {
        var result = await service.DeleteAsync(id, token);
        return result.ToResponse("Successfully deleted");
    }
}
