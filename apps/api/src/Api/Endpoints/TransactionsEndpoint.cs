using Kijk.Api.Modules.Transactions;

namespace Kijk.Api.Endpoints;

public static class TransactionsEndpoint
{
    public static IEndpointRouteBuilder MapTransactionsEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/transactions")
            .WithTags("Transactions");

        group.MapGetByTransactions()
            .MapGetByIdTransaction()
            .MapGetYearsFromTransactions()
            .MapCreateTransaction()
            .MapUpdateTransaction()
            .MapDeleteTransaction();

        return endpointRouteBuilder;
    }
}