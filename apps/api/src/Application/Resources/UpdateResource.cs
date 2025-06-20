using Kijk.Application.Resources.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Resources;

public record UpdateResourceRequest(string? Name, string? Color, string? Unit);

/// <summary>
/// Handler for updating a resource.
/// </summary>
public static class UpdateResourceHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateResourceHandler));

    public static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> HandleAsync(Guid id, UpdateResourceRequest request,
        AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Error("User with id {Id} could not be found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound($"User with id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        var resource = await dbContext.Resources.FindAsync([id], cancellationToken);
        if (resource is null)
        {
            Logger.Error("Resource with id {Id} could not be found", id);
            return TypedResults.Problem(Error.NotFound($"Resource with id {id} was not found").ToProblemDetails());
        }

        resource.Name = request.Name ?? resource.Name;
        resource.Color = request.Color ?? resource.Color;
        resource.Unit = request.Unit ?? resource.Unit;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new ResourceResponse(
            resource.Id,
            resource.Name,
            resource.Color,
            resource.Unit,
            resource.CreatorType
        ));
    }
}