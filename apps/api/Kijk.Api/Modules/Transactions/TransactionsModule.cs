namespace Kijk.Api.Modules.Transactions;

public static class TransactionsModule
{
    public static IServiceCollection AddTransactionsModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateTransactionRequest>, CreateTransactionsValidator>();

        return services;
    }
}