using System.Globalization;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Application.Transactions;

public class TransactionsService(AppDbContext dbContext, CurrentUser currentUser)
{
    private readonly ILogger _logger = Log.ForContext<TransactionsService>();

    /// <summary>
    ///     Retrieves all transactions for the current user by year and month.
    /// </summary>
    /// <param name="year"></param>
    /// <param name="month"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<AppResult<List<TransactionDto>>> GetByAsync(int? year, string? month, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await dbContext.Users.FindAsync([currentUser.Id], cancellationToken);
            if (user is null)
            {
                return AppError.NotFound($"User for id '{currentUser.Id}' was not found");
            }

            var monthInt = month is not null ? DateTime.ParseExact(month, "MMMM", CultureInfo.CurrentCulture).Month : -1;

            return await dbContext.Accounts
                .AsNoTracking()
                .Where(x => x.UserId == user.Id)
                .SelectMany(x => x.Transactions)
                .If(year != null, q => q.Where(x => x.ExecutedAt.Year == year))
                .If(monthInt != -1, q => q.Where(x => x.ExecutedAt.Month == monthInt))
                .Select(
                    x => new TransactionDto(
                        x.Id,
                        x.Name,
                        x.Amount,
                        x.Type,
                        x.ExecutedAt,
                        CategoryDto.Create(x.Category)))
                .ToListAsync(cancellationToken);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    public async Task<AppResult<TransactionDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await dbContext.Transactions
                .Where(x => x.Id == id)
                .Select(
                    x => new TransactionDto(
                        x.Id,
                        x.Name,
                        x.Amount,
                        x.Type,
                        x.ExecutedAt,
                        CategoryDto.Create(x.Category)))
                .FirstOrDefaultAsync(cancellationToken);

            if (entity is null)
            {
                return AppError.NotFound($"Transaction for Id '{id}' was not found.");
            }

            return entity;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    public async Task<AppResult<TransactionDto>> CreateAsync(
        CreateTransactionRequest createTransactionRequest,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await dbContext.Users.FindAsync([currentUser.Id], cancellationToken);
            if (user is null)
            {
                return AppError.NotFound($"User for id '{currentUser.Id}' was not found");
            }

            var account = await dbContext.Accounts
                .Where(x => x.Id == createTransactionRequest.AccountId)
                .Where(x => x.UserId == user.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (account is null)
            {
                _logger.Warning("Error: Account with id {AccountId} could not be found", createTransactionRequest.AccountId);
                return AppError.NotFound($"Account with id '{createTransactionRequest.AccountId}' could not be found");
            }

            Category? category;
            if (createTransactionRequest.CategoryId is not null)
            {
                var foundCategory = await dbContext.Categories
                    .FindAsync([createTransactionRequest.CategoryId], cancellationToken: cancellationToken);

                if (foundCategory is not null)
                {
                    category = foundCategory;
                }
                else
                {
                    _logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", createTransactionRequest.CategoryId);
                    return AppError.NotFound($"The selected category with id '{createTransactionRequest.CategoryId}', doesn't exist");
                }
            }
            else
            {
                category = await dbContext.Categories
                    .Where(x => x.Type == CategoryType.Default && x.Name == "Uncategorized")
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (category is null)
            {
                _logger.Warning("Category could not be set");
                return AppError.NotFound("Category could not be set");
            }

            var newTransaction = Transaction.Create(
                createTransactionRequest.Name,
                createTransactionRequest.Amount,
                createTransactionRequest.Type,
                createTransactionRequest.ExecutedAt,
                account,
                category);

            var resEntityEntry = await dbContext.Transactions.AddAsync(newTransaction, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            var entity = resEntityEntry.Entity;
            return new TransactionDto(
                entity.Id,
                entity.Name,
                entity.Amount,
                entity.Type,
                entity.ExecutedAt,
                CategoryDto.Create(entity.Category));
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    public async Task<AppResult<TransactionDto>> UpdateAsync(
        Guid id,
        UpdateTransactionRequest updateTransactionRequest,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await dbContext.Transactions
                .Include(x => x.Category)
                .Where(x => x.Id == id)
                .SingleOrDefaultAsync(cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Transaction with id {Id} could not be found", id);
                return AppError.NotFound($"Transaction with id '{id}' could not be found");
            }

            foundEntity.Name = updateTransactionRequest.Name ?? foundEntity.Name;
            foundEntity.Amount = updateTransactionRequest.Amount ?? foundEntity.Amount;
            foundEntity.Type = updateTransactionRequest.Type ?? foundEntity.Type;
            foundEntity.ExecutedAt = updateTransactionRequest.ExecutedAt ?? foundEntity.ExecutedAt;

            if (updateTransactionRequest.CategoryId is not null)
            {
                var category = await dbContext.Categories
                    .FindAsync(new object?[] { updateTransactionRequest.CategoryId }, cancellationToken: cancellationToken);

                if (category is not null)
                {
                    foundEntity.Category = category;
                }
                else
                {
                    _logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", updateTransactionRequest.CategoryId);
                    return AppError.Basic($"The selected category with id '{updateTransactionRequest.CategoryId}', doesn't exist");
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return new TransactionDto(
                id,
                foundEntity.Name,
                foundEntity.Amount,
                foundEntity.Type,
                foundEntity.ExecutedAt,
                CategoryDto.Create(foundEntity.Category));
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic();
        }
    }

    public async Task<AppResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await dbContext.Transactions.FindAsync(new object[] { id }, cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Transaction with id {Id} could not be found", id);
                return AppError.NotFound($"Transaction with id {id} could not be found");
            }

            dbContext.Transactions.Remove(foundEntity);
            await dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic();
        }
    }

    /// <summary>
    ///     Retrieves all years that have transactions and all yeats in between.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns>A list of years </returns>
    public async Task<AppResult<YearDto>> GetYearsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await dbContext.Users.FindAsync([currentUser.Id], cancellationToken);
            if (user is null)
            {
                return AppError.NotFound($"User for id '{currentUser.Id}' was not found");
            }

            var yearsWithTransactions = await dbContext.Accounts
                .AsNoTracking()
                .Where(x => x.UserId == user.Id)
                .SelectMany(x => x.Transactions)
                .Select(x => x.ExecutedAt.Year)
                .Distinct()
                .ToListAsync(cancellationToken);

            List<int> years = [];
            var currentYear = DateTime.UtcNow.Year;
            for (int i = yearsWithTransactions.Min(); i <= currentYear; i++)
            {
                years.Add(i);
            }

            return new YearDto(years.OrderByDescending(x => x).ToList());
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }
}
