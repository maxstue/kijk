using System.Security.Cryptography;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Application.Users;

public class UsersService(CurrentUser currentUser, AppDbContext dbContext)
{
    private readonly ILogger _logger = Log.ForContext<UsersService>();

    /// <summary>
    ///     Creates a new user or retrieves an existing user by the <see cref="CurrentUser"/> object.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    public async Task<AppResult<UserSmallResponse>> SignInAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (currentUser.User.Name == AppConstants.CreateUserIdentifier)
            {
                var newUser = User.Create(
                    currentUser.AuthId,
                    AppConstants.CreateUserIdentifier + "-" + RandomNumberGenerator.GetInt32(0, Int32.MaxValue),
                    currentUser.Email,
                    default,
                    true);

                var newUserEntry = await dbContext.Users.AddAsync(newUser, cancellationToken);
                var newUserEntity = newUserEntry.Entity;

                await dbContext.SaveChangesAsync(cancellationToken);

                return new UserSmallResponse(
                    newUserEntity.Id,
                    newUserEntity.AuthId,
                    newUserEntity.Name,
                    newUserEntity.Email,
                    newUserEntity.FirstTime);
            }

            var userEntity = await dbContext.Users
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                _logger.Warning("Error: User not found but also no 'CreateUserIdentifier' was set");
                return AppError.NotFound();
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return new UserSmallResponse(
                userEntity.Id,
                userEntity.AuthId,
                userEntity.Name,
                userEntity.Email,
                userEntity.FirstTime);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <summary>
    ///     Initiates a newly created user.
    /// </summary>
    /// <param name="userInitRequest">The user init settings.</param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    public async Task<AppResult<UserSmallResponse>> InitAsync(UserInitRequest userInitRequest, CancellationToken cancellationToken = default)
    {
        try
        {
            var userEntity = await dbContext.Users
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                _logger.Warning("Error: User not found");
                return AppError.NotFound();
            }

            userEntity.FirstTime = false;
            userEntity.Name = userInitRequest.UserName;

            if (userInitRequest.UseDefaultCategories is true)
            {
                var defaultCategories = await dbContext.Categories.Where(x => x.Type == CategoryType.Default).ToListAsync(cancellationToken);
                userEntity.SetDefaultCategories(true, defaultCategories);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return new UserSmallResponse(
                userEntity.Id,
                userEntity.AuthId,
                userEntity.Name,
                userEntity.Email,
                userEntity.FirstTime);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <summary>
    ///     Gets the current user with all related data.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    public async Task<AppResult<UserResponse>> MeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var userEntity = await dbContext.Users
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                _logger.Warning("Error: User not found");
                return AppError.NotFound();
            }

            return new UserResponse(
                userEntity.Id,
                userEntity.AuthId,
                userEntity.Name,
                userEntity.Email,
                userEntity.FirstTime,
                userEntity.Transactions.Select(
                    x => new TransactionDto(
                        x.Id,
                        x.Name,
                        x.Amount,
                        x.Type,
                        x.ExecutedAt,
                        x.Category?.MapToDto())),
                userEntity.Categories.Select(c => c.MapToDto()));
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <summary>
    ///     Updates the user with the given values..
    /// </summary>
    /// <param name="userUpdateRequest">The user update values.</param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    public async Task<AppResult<UserSmallResponse>> UpdateAsync(UserUpdateRequest userUpdateRequest, CancellationToken cancellationToken = default)
    {
        try
        {
            var userEntity = await dbContext.Users
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                _logger.Warning("Error: User not found");
                return AppError.NotFound();
            }

            userEntity.FirstTime = false;
            userEntity.Name = userUpdateRequest.UserName;

            var defaultCategories = await dbContext.Categories.Where(x => x.Type == CategoryType.Default).ToListAsync(cancellationToken);
            userEntity.SetDefaultCategories(userUpdateRequest.UseDefaultCategories, defaultCategories);

            await dbContext.SaveChangesAsync(cancellationToken);

            return new UserSmallResponse(
                userEntity.Id,
                userEntity.AuthId,
                userEntity.Name,
                userEntity.Email,
                userEntity.FirstTime);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }
}
