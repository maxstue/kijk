using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;
using UserResponse = Kijk.Application.Users.Shared.UserResponse;

namespace Kijk.Application.Users;

public record WelcomeUserRequest(string? UserName, bool? UseDefaultResources);

/// <summary>
/// Handler for creating a new user after the welcome process.
/// </summary>
public class WelcomeUserHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<WelcomeUserHandler> logger)
{
    public async Task<Result<UserResponse>> WelcomeAsync(WelcomeUserRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            logger.LogError("User not found: {UserId}", currentUser.Id);
            return Error.NotFound("User not found");
        }

        if (request.UserName is null)
        {
            logger.LogError("User name is null");
            return Error.Unexpected("User name is null");
        }

        if (!user.FirstTime)
        {
            logger.LogError("User is already welcome");
            return Error.Unexpected("Your are already welcome");
        }

        user.FirstTime = false;
        user.Name = request.UserName;

        if (request.UseDefaultResources is true)
        {
            var defaultCategories = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            user.SetDefaultResources(true, defaultCategories);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return new UserResponse(
            user.Id,
            user.AuthId,
            user.Name,
            user.Email,
            user.FirstTime,
            user.Resources.Any(c => c.CreatorType == CreatorType.System));
    }
}