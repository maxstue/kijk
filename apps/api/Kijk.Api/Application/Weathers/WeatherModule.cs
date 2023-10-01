using Kijk.Api.Common.interfaces;

namespace Kijk.Api.Application.Weathers;

public class WeatherModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services)
    {
        services.AddScoped<IWeatherService, WeatherService>();

        services.AddScoped<IValidator<WeatherDTO>, WeatherValidator>();

        return services;
    }
}
