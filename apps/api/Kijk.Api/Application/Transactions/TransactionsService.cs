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
                        x.Categories.Select(c => new CategoryDto(c.Id, c.Name, c.Color))))
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
                        x.Categories.Select(c => new CategoryDto(c.Id, c.Name, c.Color))))
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

    public async Task<Result<TransactionDto>> CreateAsync(CreateTransactionRequest createTransactionRequest, CancellationToken cancellationToken = default)
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
                Categories = new ()
            };

            if (createTransactionRequest.CategoryIds is not null && createTransactionRequest.CategoryIds.Any())
            {
                var categories = await _dbContext.Categories
                    .Where(x => createTransactionRequest.CategoryIds.Contains(x.Id))
                    .ToListAsync(cancellationToken);

                newTransaction.Categories = categories;
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
                entity.Categories.Select(c => new CategoryDto(c.Id, c.Name, c.Color)));
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
                .Include(x => x.Categories)
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

            if (updateTransactionRequest.CategoryIds is not null && updateTransactionRequest.CategoryIds.Any())
            {
                var categories = await _dbContext.Categories
                    .Where(x => updateTransactionRequest.CategoryIds.Contains(x.Id))
                    .ToListAsync(cancellationToken);

                foundEntity.Categories = categories;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return new TransactionDto(
                id,
                foundEntity.Name,
                foundEntity.Amount,
                foundEntity.Type,
                foundEntity.ExecutedAt,
                foundEntity.Categories.Select(c => new CategoryDto(c.Id, c.Name, c.Color)));
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
