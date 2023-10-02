using Kijk.Api.Application.Transactions;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Filters;
using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kijk.Api.Endpoints;

public static class TransactionEndpoint
{
    public static IEndpointRouteBuilder MapTransactionEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/transaction");

        group.MapGet("/", GetAll);
        group.MapGet("/auth", GetAll).RequireAuthorization(AppConstants.Policies.All);
        group.MapGet("/{id:guid}", GetById);
        group.MapPost("/", Create).AddEndpointFilter<ValidationFilter<TransactionDto>>();
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", DeleteById);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> GetAll(ITransactionService service, CurrentUser user, IOptions<AppSettings> options)
    {
        var result = await service.GetAll();
        return result.ToResponse("Erfolgreich geladen");
    }

    private static async Task<IResult> GetById(ITransactionService service, Guid id, CancellationToken token)
    {
        var result = await service.GetById(id, token);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> Create(ITransactionService service, [FromBody] TransactionDto transactionDto, CancellationToken token)
    {
        var result = await service.Create(transactionDto, token);
        return result.ToResponse("Successfully created", SuccessType.Created);
    }

    private static async Task<IResult> Update(ITransactionService service, Guid id, TransactionDto transactionDto, CancellationToken token)
    {
        var result = await service.Update(id, transactionDto, token);

        return result.ToResponse("Successfully updated");
    }

    private static async Task<IResult> DeleteById(ITransactionService service, Guid id, CancellationToken token)
    {
        var result = await service.Delete(id, token);
        return result.ToResponse("Successfully deleted");
    }
}
