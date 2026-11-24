using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Spaces.Create;

/// <summary>
/// Creates a shared space for the current user.
/// </summary>
public sealed class CreateHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateHandler> logger)
{
    /// <summary>
    /// Creates a shared space with its cash account; the current user becomes its admin.
    /// </summary>
    /// <param name="request">The details of the new space.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created space.</returns>
    public async Task<Result<CreateSpaceResponse>> HandleAsync(CreateSpaceRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("User could not be found");
        }

        var adminRole = await dbContext.Roles.SingleOrDefaultAsync(role => role.Id == SpaceRoles.Admin.Id, cancellationToken);
        if (adminRole is null)
        {
            logger.LogError(new InvalidOperationException("Admin role was not found"), "A space could not be created");
            return Error.Unexpected("Role was not found");
        }

        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        var space = Space.Create(request.Name.Trim(), description);
        dbContext.UserSpaces.Add(UserSpace.Create(user, space, adminRole));
        await dbContext.SaveChangesAsync(cancellationToken);
        return new CreateSpaceResponse(space.Id, space.Name);
    }
}