using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Users;

public interface IUsersService
{
    /// <summary>
    /// Creates a new user or retrieves an existing user by the set <see cref="CurrentUser"/>.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    Task<AppResult<UserResponse>> InitAsync(CancellationToken cancellationToken = default);
}
