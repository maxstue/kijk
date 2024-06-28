using Kijk.Api.Modules.Users;

namespace Kijk.Api.Endpoints;

public static class UsersEndpoint
{
    public static IEndpointRouteBuilder MapUsersApi(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/users")
            .WithTags("Users");

        group.MapSignInUser()
            .MapGetMe()
            .MapWelcomeUser()
            .MapUpdateUser();

        return endpointRouteBuilder;
    }
}
