using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Budgets.Create;
using Kijk.Application.Budgets.Delete;
using Kijk.Application.Budgets.Get;
using Kijk.Application.Budgets.Shared;
using Kijk.Application.Budgets.Statistics;
using Kijk.Application.Budgets.Update;
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
        var group = builder.MapGroup("budgets")
            .WithTags("Budgets")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Gets all budget versions of the active household");
        group.MapGet("/statistics", GetStatistics).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Gets the spending per category over several months");
        group.MapGet("/overview", GetOverview).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Evaluates the budgets for a calendar month");
        group.MapPost("/", Create).RequireHouseholdPermission(HouseholdPermissions.Budgets.Plan).WithRequestValidation<CreateBudgetRequest>().WithSummary("Creates a budget for a category from a month on");
        group.MapPut("/{id:guid}", Update).RequireHouseholdPermission(HouseholdPermissions.Budgets.Plan).WithRequestValidation<UpdateBudgetRequest>().WithSummary("Updates a budget version");
        group.MapDelete("/{id:guid}", Delete).RequireHouseholdPermission(HouseholdPermissions.Budgets.Plan).WithSummary("Deletes a budget version");

        return builder;
    }

    private static async Task<Results<Ok<List<BudgetResponse>>, ProblemHttpResult>> GetAll(GetBudgetsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<BudgetOverviewResponse>, ProblemHttpResult>> GetOverview(
        [FromQuery] int year,
        [FromQuery] int month,
        GetBudgetsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetOverviewAsync(year, month, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<BudgetResponse>, ProblemHttpResult>> Create(
        CreateBudgetRequest request,
        CreateBudgetHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<BudgetResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateBudgetRequest request,
        UpdateBudgetHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteBudgetHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<BudgetStatisticsResponse>, ProblemHttpResult>> GetStatistics(
        int year,
        int month,
        int? months,
        GetBudgetStatisticsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetAsync(year, month, months ?? 12, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}