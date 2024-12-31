namespace Kijk.Api.Modules.Transactions;

public static class ModuleService
{
    public static IServiceCollection AddTransactionsModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateTransactionRequest>, CreateTransactionsValidator>();

        return services;
    }
}