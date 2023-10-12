using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Users;

public interface IUserService
{
    /// <summary>
    /// Creates a new user or retrieves an existing user by the set <see cref="CurrentUser"/>.
    /// </summary>
    /// <param name="authUser">The user initials.</param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    Task<Result<UserResponse>> Init(AuthUser authUser, CancellationToken cancellationToken = default);
}
