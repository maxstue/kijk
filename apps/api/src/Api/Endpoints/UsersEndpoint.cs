using Kijk.Application.Users.Endpoints;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for users
/// </summary>
public static class UsersEndpoint
{
    public static IEndpointRouteBuilder MapUsersApi(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/users")
            .WithTags("Users");

        group.MapGet("/me", GetMeUser.HandleAsync)
            .WithSummary("Gets me");

        group.MapGet("", SignInUser.HandleAsync)
            .WithSummary("Sign in");

        group.MapPut("", UpdateUser.HandleAsync)
            .WithSummary("Updates user");

        group.MapPut("/welcome", WelcomeUser.HandleAsync)
            .WithSummary("Registers a new user and sets some default values");

        return endpointRouteBuilder;
    }
}