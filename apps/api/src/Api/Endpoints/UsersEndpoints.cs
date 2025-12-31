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

        group.MapGet("/me", GetMe)
            .WithSummary("Gets me");

        group.MapGet("/sign-in", SignIn)
            .WithSummary("Sign in");

        group.MapPut("", Update)
            .WithSummary("Updates the current user");

        group.MapPut("/welcome", Welcome)
            .WithSummary("Registers a new user and sets some default values");

        return builder;
    }

    /// <summary>
    /// Gets the current user.
    /// </summary>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<GetMeUserResponse>, ProblemHttpResult>> GetMe(GetMeUserHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetMeAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// First call to validate the user and return a small subset of data about the user.
    /// </summary>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> SignIn(SignInUserHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.SignInAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Updates the current user.
    /// </summary>
    /// <param name="request"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> Update(UpdateUserRequest request, UpdateUserHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Registers a new user and sets some default values.
    /// </summary>
    /// <param name="request"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> Welcome([FromBody] WelcomeUserRequest request, WelcomeUserHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.WelcomeAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}