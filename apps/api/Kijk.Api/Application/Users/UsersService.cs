using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Application.Users;

public class UsersService : IUsersService
{
    private readonly ILogger _logger = Log.ForContext<UsersService>();
    private readonly CurrentUser _currentUser;
    private readonly AppDbContext _dbContext;

    public UsersService(CurrentUser currentUser, AppDbContext dbContext)
    {
        _currentUser = currentUser;
        _dbContext = dbContext;
    }

    public async Task<Result<UserResponse>> InitAsync(AuthUser authUser, CancellationToken cancellationToken)
    {
        try
        {
            if (_currentUser.User.Name == AppConstants.CreateUserIdentifier)
            {
                var newUser = new User
                {
                    Id = Guid.NewGuid(),
                    AuthId = authUser.Id,
                    Name = authUser.GivenName ?? AppConstants.CreateUserIdentifier,
                    Email = authUser?.Email
                };

                var newUserEntry = await _dbContext.Users.AddAsync(newUser, cancellationToken);
                var newUserEntity = newUserEntry.Entity;

                await _dbContext.SaveChangesAsync(cancellationToken);

                return new UserResponse(
                    newUserEntity.Id,
                    newUserEntity.AuthId,
                    newUserEntity.Name,
                    newUserEntity.Email,
                    newUserEntity.Transactions.Select(
                        x => new TransactionDto(
                            x.Id,
                            x.Name,
                            x.Amount,
                            x.Type,
                            x.ExecutedAt,
                            x.Category?.MapToDto())),
                    newUserEntity.Categories.Select(c => c.MapToDto()));
            }

            var userEntity = await _dbContext.Users
                .Include(x => x.Transactions)
                .Include(x => x.Categories)
                .Where(x => x.Id == _currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                _logger.Warning("Error: User not found but also no createIdentifier was set");
                return UserErrors.NotFound();
            }

            return new UserResponse(
                userEntity.Id,
                userEntity.AuthId,
                userEntity.Name,
                userEntity.Email,
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
            return UserErrors.Failure(e.Message);
        }
    }
}
