using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public interface ITransactionsService
{
    Task<AppResult<List<TransactionDto>>> GetByAsync(int? year, string? month, CancellationToken cancellationToken = default);

    Task<AppResult<TransactionDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<AppResult<TransactionDto>> CreateAsync(CreateTransactionRequest transactionDto, CancellationToken cancellationToken = default);

    Task<AppResult<TransactionDto>> UpdateAsync(Guid id, UpdateTransactionRequest transactionDto, CancellationToken cancellationToken = default);

    Task<AppResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
