using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Dashboard.Queries;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>Shared summaries available to every member of the route space.</summary>
public sealed class DashboardEndpoints : IEndpointGroup
{
    private const string SharedDashboardPermissionReason = "Every space member may read shared dashboard aggregates";

    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapSpaceGroup("dashboard").WithTags("Dashboard")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);
        group.MapGet("/finances", Finances).WithName("Dashboard.Finances")
            .WithoutSpacePermission(SharedDashboardPermissionReason)
            .RequireFeature(AppConstants.Features.Finances);
        group.MapGet("/budgets", Budgets).WithName("Dashboard.Budgets")
            .WithoutSpacePermission(SharedDashboardPermissionReason)
            .RequireFeature(AppConstants.Features.Finances);
        group.MapGet("/consumptions", Consumptions).WithName("Dashboard.Consumptions")
            .WithoutSpacePermission(SharedDashboardPermissionReason);
        group.MapGet("/limits", Limits).WithName("Dashboard.Limits")
            .WithoutSpacePermission(SharedDashboardPermissionReason);
        return builder;
    }

    private static async Task<Results<Ok<List<FinanceMonth>>, ProblemHttpResult>> Finances(int year, QueriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.FinancesAsync(year, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<DashboardBudget>>, ProblemHttpResult>> Budgets(int year, int month, QueriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.BudgetsAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<ConsumptionMonth>>, ProblemHttpResult>> Consumptions(int year, QueriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.ConsumptionsAsync(year, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<DashboardLimit>>, ProblemHttpResult>> Limits(int year, int month, QueriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.LimitsAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}