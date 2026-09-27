using Kijk.Application.Units.Shared;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddModules()
            .AddHandlers()
            .AddScoped<IUnitConversionService, UnitsNetConversionService>()
            .AddSingleton(TimeProvider.System);

        return services;
    }

}