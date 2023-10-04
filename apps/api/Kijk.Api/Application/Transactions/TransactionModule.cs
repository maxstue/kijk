namespace Kijk.Api.Application.Transactions;

public static class TransactionModule
{
    public static IServiceCollection RegisterTransactionModule(this IServiceCollection services)
    {
        services.AddScoped<ITransactionService, TransactionService>();

        services.AddScoped<IValidator<CreateTransactionRequest>, TransactionValidator>();

        return services;
    }
}
