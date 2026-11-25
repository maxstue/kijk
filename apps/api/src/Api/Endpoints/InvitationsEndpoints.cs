using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Spaces.AcceptInvitation;
using Kijk.Application.Spaces.PreviewInvitation;
using Kijk.Application.Spaces.Shared;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for people who received an invitation link. They take the token in the body, never in the path.
/// </summary>
public sealed class InvitationsEndpoints : IEndpointGroup
{
    private const string TokenProvesTheInvitation = "The invitation token grants access; the caller is not a member of the space yet.";

    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        // The preview is public so people see who invites them before they sign up; accepting needs an account.
        var group = builder.MapGroup("/invitations")
            .WithTags("Invitations")
            .RequireRateLimiting(AppConstants.InvitationRateLimit);

        group.MapPost("/preview", Preview).WithName("Invitations.Preview")
            .AllowAnonymous()
            .WithoutSpacePermission(TokenProvesTheInvitation)
            .WithRequestValidation<InvitationTokenRequest>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .WithSummary("Shows what a pending invitation offers, also before signing in");
        group.MapPost("/accept", Accept).WithName("Invitations.Accept")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted)
            .WithoutSpacePermission(TokenProvesTheInvitation)
            .WithRequestValidation<InvitationTokenRequest>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Joins the space of an invitation with the invited role");
        return builder;
    }

    private static async Task<Results<Ok<InvitationPreviewResponse>, ProblemHttpResult>> Preview(
        InvitationTokenRequest request,
        PreviewInvitationHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AcceptInvitationResponse>, ProblemHttpResult>> Accept(
        InvitationTokenRequest request,
        AcceptInvitationHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}