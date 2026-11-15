using Kijk.Api.Authorization;
using Kijk.Api.Models;
using Kijk.Application.Units.List;
using Kijk.Application.Units.Shared;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for the system unit catalog.
/// </summary>
public sealed class UnitsEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/units")
            .WithTags("Units")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("", List).WithName("Units.List").WithoutSpacePermission("Lists the system unit catalog, which is the same for every user.").WithSummary("Gets all units");
        return builder;
    }

    private static async Task<Ok<List<UnitResponse>>> List([FromServices] ListHandler handler, CancellationToken cancellationToken) =>
        TypedResults.Ok(await handler.HandleAsync(cancellationToken));
}