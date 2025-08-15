using Kijk.Application.Users;
using Kijk.Shared;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for users.
/// </summary>
public class UsersEndpoints : IEndpointGroup
{
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/users")
            .WithTags("Users");

        group.MapGet("/me", GetMeUserHandler.HandleAsync)
            .WithSummary("Gets me");

        group.MapGet("/sign-in", SignInUserHandler.HandleAsync)
            .WithSummary("Sign in");

        group.MapPut("", UpdateUserHandler.HandleAsync)
            .WithSummary("Updates the current user");

        group.MapPut("/welcome", WelcomeUserHandler.HandleAsync)
            .WithSummary("Registers a new user and sets some default values");

        return builder;
    }
}