namespace Kijk.Api.Application.Weathers;

public static class WeatherModule
{
    public static IServiceCollection RegisterWeatherModule(this IServiceCollection services)
    {
        services.AddScoped<IWeatherService, WeatherService>();

        services.AddScoped<IValidator<WeatherDTO>, WeatherValidator>();

        return services;
    }
}
