using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.CategoryRules.Delete;
using Kijk.Application.CategoryRules.Get;
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
        var group = builder.MapGroup("category-rules")
            .WithTags("Category Rules")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets the remembered category corrections of the active space");
        group.MapGet("/suggestions", GetSuggestions).RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Suggests rules from repeated manual corrections; remembering the suggested transaction's category creates the rule");
        group.MapDelete("/{id:guid}", Delete).RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Deletes a remembered category correction");

        return builder;
    }

    private static async Task<Results<Ok<List<CategoryRuleResponse>>, ProblemHttpResult>> GetAll(GetCategoryRulesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<CategoryRuleSuggestionResponse>>, ProblemHttpResult>> GetSuggestions(
        GetCategoryRuleSuggestionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteCategoryRuleHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}