using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Budgets.DeleteVersion;
using Kijk.Application.Budgets.Queries;
using Kijk.Application.Budgets.SetFromMonth;
using Kijk.Application.Budgets.Shared;
using Kijk.Application.Budgets.Statistics;
using Kijk.Application.Budgets.UpdateVersion;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for budgets and the monthly budget overview.
/// </summary>
public sealed class BudgetsEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapSpaceGroup("budgets")
            .WithTags("Budgets")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted)
            .RequireFeature(AppConstants.Features.Finances);

        group.MapGet("/", ListVersions).WithName("Budgets.ListVersions").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets all budget versions of the active space");
        group.MapGet("/statistics", Statistics).WithName("Budgets.Statistics").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets the spending per category over several months");
        group.MapGet("/overview", Overview).WithName("Budgets.Overview").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Evaluates the budgets for a calendar month");
        group.MapPut("/", SetFromMonth).WithName("Budgets.SetFromMonth").RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<SetBudgetRequest>().WithSummary("Sets the budget of a category from a month on; shared budgets additionally require budgets:plan");
        group.MapPut("/{id:guid}", UpdateVersion).WithName("Budgets.UpdateVersion").RequireSpacePermission(SpacePermissions.Finances.Record).WithRequestValidation<UpdateBudgetRequest>().WithSummary("Updates a budget version; shared budgets additionally require budgets:plan");
        group.MapDelete("/{id:guid}", DeleteVersion).WithName("Budgets.DeleteVersion").RequireSpacePermission(SpacePermissions.Finances.Record).WithSummary("Deletes a budget version; shared budgets additionally require budgets:plan");

        return builder;
    }

    private static async Task<Results<Ok<List<BudgetResponse>>, ProblemHttpResult>> ListVersions(QueriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.ListVersionsAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<BudgetOverviewResponse>, ProblemHttpResult>> Overview(
        [FromQuery] int year,
        [FromQuery] int month,
        QueriesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.OverviewAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<BudgetResponse>, ProblemHttpResult>> SetFromMonth(
        SetBudgetRequest request,
        SetFromMonthHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<BudgetResponse>, ProblemHttpResult>> UpdateVersion(
        Guid id,
        UpdateBudgetRequest request,
        UpdateVersionHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> DeleteVersion(Guid id, DeleteVersionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<BudgetStatisticsResponse>, ProblemHttpResult>> Statistics(
        int year,
        int month,
        int? months,
        StatisticsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(year, month, months ?? 12, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}