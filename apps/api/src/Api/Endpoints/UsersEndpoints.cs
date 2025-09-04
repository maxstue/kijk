using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Users;
using Kijk.Application.Users.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

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

        group.MapGet("/me", async Task<Results<Ok<GetMeUserResponse>, ProblemHttpResult>> (GetMeUserHandler handler, CancellationToken cancellationToken) =>
        {
            var result = await handler.GetMeAsync(cancellationToken);
            return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
        }).WithSummary("Gets me");

        group.MapGet("/sign-in", async Task<Results<Ok<UserResponse>, ProblemHttpResult>> (SignInUserHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.SignInAsync(cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Sign in");

        group.MapPut("", async Task<Results<Ok<UserResponse>, ProblemHttpResult>> ([FromBody] UpdateUserRequest request, UpdateUserHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.UpdateAsync(request, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Updates the current user");

        group.MapPut("/welcome", async Task<Results<Ok<UserResponse>, ProblemHttpResult>> ([FromBody] WelcomeUserRequest request, WelcomeUserHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.WelcomeAsync(request, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Registers a new user and sets some default values");

        return builder;
    }
}