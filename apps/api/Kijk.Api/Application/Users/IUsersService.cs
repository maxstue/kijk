using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Users;

public interface IUsersService
{
    /// <summary>
    ///     Creates a new user or retrieves an existing user by the <see cref="CurrentUser"/> object.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    Task<AppResult<UserResponse>> SignInAsync(CancellationToken cancellationToken = default);

    /// <summary>
    ///     Initiates a newly created user.
    /// </summary>
    /// <param name="userInitRequest">The user init settings.</param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    Task<AppResult<UserResponse>> InitAsync(UserInitRequest userInitRequest, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Updates the user with the given values..
    /// </summary>
    /// <param name="userUpdateRequest">The user update values.</param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    Task<AppResult<UserResponse>> UpdateAsync(UserUpdateRequest userUpdateRequest, CancellationToken cancellationToken = default);
}
