using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Application.Transactions;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger _logger = Log.ForContext<TransactionService>();

    public TransactionService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<TransactionDto>> Create(TransactionDto transactionDto, CancellationToken cancellationToken = default)
    {
        try
        {
            var newTransaction = new Transaction { Name = transactionDto.Name };
            
            var resEntityEntry = await _dbContext.Transactions.AddAsync(newTransaction, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return new TransactionDto(resEntityEntry.Entity.Id, resEntityEntry.Entity.Name);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionErrors.Failure(e.Message);
        }
    }

    public async Task<Result<TransactionDto>> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _dbContext.Transactions
                .Where(x => x.Id == id)
                .Select(x => new TransactionDto(x.Id, x.Name))
                .FirstOrDefaultAsync(cancellationToken);

            if (entity is null)
            {
                return TransactionErrors.NotFound();
            }

            return entity;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionErrors.Failure(e.Message);
        }
    }

    public async Task<Result<List<TransactionDto>>> GetAll(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Transactions
                .Select(x => new TransactionDto(x.Id, x.Name))
                .ToListAsync(cancellationToken);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionErrors.Failure(e.Message);
        }
    }

    public async Task<Result<TransactionDto>> Update(Guid id, TransactionDto transactionDto, CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await _dbContext.Transactions.FindAsync(new object[] { id }, cancellationToken: cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Transaction with id {Id} could not be found", id);
                return TransactionErrors.NotFound();
            }

            foundEntity.Name = transactionDto.Name;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new TransactionDto(foundEntity.Id, foundEntity.Name);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionErrors.Failure();
        }
    }

    public async Task<Result<bool>> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await _dbContext.Transactions.FindAsync(new object[] { id }, cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Transaction with id {Id} could not be found", id);
                return TransactionErrors.NotFound();
            }

            _dbContext.Transactions.Remove(foundEntity);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return TransactionErrors.Failure();
        }
    }
}
