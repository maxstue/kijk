using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.CategoryRules.Delete;
using Kijk.Application.CategoryRules.List;
using Kijk.Application.CategoryRules.Shared;
using Kijk.Application.CategoryRules.Suggestions;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for remembered category corrections.
/// </summary>
public sealed class CategoryRulesEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapSpaceGroup("category-rules")
            .WithTags("Category Rules")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted)
            .RequireFeature(AppConstants.Features.Finances);

        group.MapGet("/", List).WithName("CategoryRules.List").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets the remembered category corrections of the active space");
        group.MapGet("/suggestions", Suggestions).WithName("CategoryRules.Suggestions").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Suggests rules from repeated manual corrections; remembering the suggested transaction's category creates the rule");
        group.MapDelete("/{id:guid}", Delete).WithName("CategoryRules.Delete").RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Deletes a remembered category correction");

        return builder;
    }

    private static async Task<Results<Ok<List<CategoryRuleResponse>>, ProblemHttpResult>> List(ListHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<CategoryRuleSuggestionResponse>>, ProblemHttpResult>> Suggestions(
        SuggestionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}