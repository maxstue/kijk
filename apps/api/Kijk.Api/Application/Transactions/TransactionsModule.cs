namespace Kijk.Api.Application.Transactions;

public static class TransactionsModule
{
    public static IServiceCollection RegisterTransactionsModule(this IServiceCollection services)
    {
        services.AddScoped<TransactionsService>();

        services.AddScoped<IValidator<CreateTransactionRequest>, CreateTransactionsValidator>();

        return services;
    }
}
