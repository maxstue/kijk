using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Users.CompleteOnboarding;
using Kijk.Application.Users.Delete;
using Kijk.Application.Users.Me;
using Kijk.Application.Users.RequestDeletion;
using Kijk.Application.Users.SetDefaultSpace;
using Kijk.Application.Users.Shared;
using Kijk.Application.Users.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for users.
/// </summary>
public class UsersEndpoints : IEndpointGroup
{
    private const string CurrentUserOnly = "Only reads or changes the current user's own account.";

    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/users")
            .WithTags("Users");

        group.MapGet("/me", Me).WithName("Users.Me")
            .WithoutSpacePermission(CurrentUserOnly)
            .WithSummary("Gets me");

        group.MapPut("/me", Update).WithName("Users.Update")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted)
            .WithoutSpacePermission(CurrentUserOnly)
            .WithRequestValidation<UpdateUserRequest>()
            .WithSummary("Updates the current user");

        group.MapPut("/default-space", SetDefaultSpace).WithName("Users.SetDefaultSpace")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted)
            .WithoutSpacePermission("Any member may open a space they belong to first; the handler checks the membership.")
            .WithSummary("Sets or clears the space the app opens first");

        group.MapPost("/me/deletion", RequestDeletion).WithName("Users.RequestDeletion")
            .WithoutSpacePermission("Deletes only the current user's own account and data.")
            .WithSummary("Deletes the current user's account and all their data in the background");

        group.MapPut("/onboarding", CompleteOnboarding).WithName("Users.CompleteOnboarding")
            .WithoutSpacePermission("Onboarding creates the user's first space.")
            .WithRequestValidation<WelcomeUserRequest>()
            .WithSummary("Completes onboarding and creates the Kijk account when needed");

        return builder;
    }

    /// <summary>
    /// Gets the current user.
    /// </summary>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<CurrentUserResponse>, ProblemHttpResult>> Me(MeHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Updates the current user.
    /// </summary>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> Update(UpdateUserRequest request, UpdateHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Registers a new user and sets some default values.
    /// </summary>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<CurrentUserResponse>, ProblemHttpResult>> CompleteOnboarding([FromBody] WelcomeUserRequest request, CompleteOnboardingHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CurrentUserResponse>, ProblemHttpResult>> SetDefaultSpace(
        SetDefaultSpaceRequest request,
        SetDefaultSpaceHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Accepted, ProblemHttpResult>> RequestDeletion(RequestDeletionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Accepted((string?)null);
    }
}