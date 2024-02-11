namespace Kijk.Api.Application.Users;

public static class UsersModule
{
    public static IServiceCollection RegisterUsersModule(this IServiceCollection services)
    {
        services.AddScoped<UsersService>();
        return services;
    }
}
