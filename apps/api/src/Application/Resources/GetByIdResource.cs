using Kijk.Application.Resources.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Resources;

public static class GetByIdResourceHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByIdResourceHandler));

    /// <summary>
    /// Handle to get a resource type by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext, CurrentUser currentUser,
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

        var resource = user.Resources
            .Where(x => x.Id == id)
            .Select(x => new ResourceResponse(x.Id, x.Name, x.Color, x.Unit, x.CreatorType))
            .FirstOrDefault();

        if (resource is null)
        {
            return TypedResults.Problem(Error.NotFound($"Resource with id '{id}' was not found").ToProblemDetails());
        }

        return TypedResults.Ok(resource);
    }
}