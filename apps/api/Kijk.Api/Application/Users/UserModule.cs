namespace Kijk.Api.Application.Users;

public static class UserModule
{
    public static IServiceCollection RegisterUSerModule(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        return services;
    }
}
