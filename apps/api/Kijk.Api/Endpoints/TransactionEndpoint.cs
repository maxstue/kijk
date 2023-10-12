using Kijk.Api.Application.Transactions;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Filters;
using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

public static class TransactionEndpoint
{
    public static IEndpointRouteBuilder MapTransactionEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/transaction");

        group.MapGet("/", GetBy);
        group.MapGet("/{id:guid}", GetById);
        group.MapPost("/", Create).AddEndpointFilter<ValidationFilter<CreateTransactionRequest>>();
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", DeleteById);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> GetBy(
        ITransactionService service,
        [FromQuery(Name = "year")] int year,
        [FromQuery(Name = "month")] string month)
    {
        var result = await service.GetBy(year, month);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> GetById(ITransactionService service, Guid id, CancellationToken token)
    {
        var result = await service.GetById(id, token);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> Create(
        ITransactionService service,
        [FromBody] CreateTransactionRequest transactionRequest,
        CancellationToken token)
    {
        var result = await service.Create(transactionRequest, token);
        return result.ToResponse("Successfully created", SuccessType.Created);
    }

    private static async Task<IResult> Update(
        ITransactionService service,
        Guid id,
        [FromBody] UpdateTransactionRequest transactionRequest,
        CancellationToken token)
    {
        var result = await service.Update(id, transactionRequest, token);
        return result.ToResponse("Successfully updated");
    }

    private static async Task<IResult> DeleteById(ITransactionService service, Guid id, CancellationToken token)
    {
        var result = await service.Delete(id, token);
        return result.ToResponse("Successfully deleted");
    }
}
