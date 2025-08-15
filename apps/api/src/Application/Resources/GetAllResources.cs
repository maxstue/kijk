using Kijk.Application.Resources.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Resources;

/// <summary>
/// Handler
/// </summary>
public static class GetAllResourcesHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetAllResourcesHandler));

    public static async Task<Results<Ok<List<ResourceResponse>>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Error("User with id '{UserId}' was not found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound($"User with id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        var resources = user.Resources
            .Select(x => new ResourceResponse(x.Id, x.Name, x.Color, x.Unit, x.CreatorType))
            .ToList();

        return TypedResults.Ok(resources);
    }
}