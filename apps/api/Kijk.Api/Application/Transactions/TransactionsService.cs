using System.Globalization;

using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Application.Transactions;

public class TransactionsService : ITransactionsService
{
    private readonly ILogger _logger = Log.ForContext<TransactionsService>();
    private readonly AppDbContext _dbContext;
    private readonly CurrentUser _currentUser;

    public TransactionsService(AppDbContext dbContext, CurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<List<TransactionDto>>> GetByAsync(int year, string month, CancellationToken cancellationToken = default)
    {
        try
        {
            var monthInt = DateTime.ParseExact(month, "MMMM", CultureInfo.CurrentCulture).Month;

            return await _dbContext.Transactions
                .AsNoTracking()
                .Where(x => x.ExecutedAt.Year == year && x.ExecutedAt.Month == monthInt)
                .Select(
                    x => new TransactionDto(
                        x.Id,
                        x.Name,
                        x.Amount,
                        x.Type,
                        x.ExecutedAt,
                        x.Category != null ? x.Category.MapToDto() : null))
                .ToListAsync(cancellationToken);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionsErrors.Failure(e.Message);
        }
    }

    public async Task<Result<TransactionDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _dbContext.Transactions
                .Where(x => x.Id == id)
                .Select(
                    x => new TransactionDto(
                        x.Id,
                        x.Name,
                        x.Amount,
                        x.Type,
                        x.ExecutedAt,
                        x.Category != null ? x.Category.MapToDto() : null))
                .FirstOrDefaultAsync(cancellationToken);

            if (entity is null)
            {
                return TransactionsErrors.NotFound();
            }

            return entity;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionsErrors.Failure(e.Message);
        }
    }

    public async Task<Result<TransactionDto>> CreateAsync(
        CreateTransactionRequest createTransactionRequest,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync(new object?[] { _currentUser.Id }, cancellationToken);
            if (user is null)
            {
                return TransactionsErrors.Failure("User not found");
            }

            var newTransaction = new Transaction
            {
                Name = createTransactionRequest.Name,
                Amount = createTransactionRequest.Amount,
                Type = createTransactionRequest.Type,
                ExecutedAt = createTransactionRequest.ExecutedAt,
                User = user,
            };

            if (createTransactionRequest.CategoryId is not null)
            {
                var category = await _dbContext.Categories
                    .FindAsync(new object?[] { createTransactionRequest.CategoryId }, cancellationToken: cancellationToken);

                if (category is not null)
                {
                    newTransaction.Category = category;
                }
                else
                {
                    _logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", createTransactionRequest.CategoryId);
                    return TransactionsErrors.Failure($"The selected category with id { createTransactionRequest.CategoryId}, doesn't exist");
                }
            }

            var resEntityEntry = await _dbContext.Transactions.AddAsync(newTransaction, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var entity = resEntityEntry.Entity;
            return new TransactionDto(
                entity.Id,
                entity.Name,
                entity.Amount,
                entity.Type,
                entity.ExecutedAt,
                entity.Category?.MapToDto());
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionsErrors.Failure(e.Message);
        }
    }

    public async Task<Result<TransactionDto>> UpdateAsync(
        Guid id,
        UpdateTransactionRequest updateTransactionRequest,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await _dbContext.Transactions
                .Include(x => x.Category)
                .Where(x => x.Id == id)
                .SingleOrDefaultAsync(cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Transaction with id {Id} could not be found", id);
                return TransactionsErrors.NotFound();
            }

            foundEntity.Name = updateTransactionRequest.Name ?? foundEntity.Name;
            foundEntity.Amount = updateTransactionRequest.Amount ?? foundEntity.Amount;
            foundEntity.Type = updateTransactionRequest.Type ?? foundEntity.Type;
            foundEntity.ExecutedAt = updateTransactionRequest.ExecutedAt ?? foundEntity.ExecutedAt;

            if (updateTransactionRequest.CategoryId is not null)
            {
                var category = await _dbContext.Categories
                    .FindAsync(new object?[] { updateTransactionRequest.CategoryId }, cancellationToken: cancellationToken);

                if (category is not null)
                {
                    foundEntity.Category = category;
                }
                else
                {
                    _logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", updateTransactionRequest.CategoryId);
                    return TransactionsErrors.Failure($"The selected category with id { updateTransactionRequest.CategoryId}, doesn't exist");
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return new TransactionDto(
                id,
                foundEntity.Name,
                foundEntity.Amount,
                foundEntity.Type,
                foundEntity.ExecutedAt,
                foundEntity.Category?.MapToDto());
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionsErrors.Failure();
        }
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await _dbContext.Transactions.FindAsync(new object[] { id }, cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Transaction with id {Id} could not be found", id);
                return TransactionsErrors.NotFound();
            }

            _dbContext.Transactions.Remove(foundEntity);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionsErrors.Failure();
        }
    }
}
