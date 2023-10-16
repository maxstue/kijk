using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public interface ITransactionsService
{
    Task<Result<List<TransactionDto>>> GetByAsync(int year, string month, CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> CreateAsync(CreateTransactionRequest transactionDto, CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> UpdateAsync(Guid id, UpdateTransactionRequest transactionDto, CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
