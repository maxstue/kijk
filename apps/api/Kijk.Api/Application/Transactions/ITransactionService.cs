using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public interface ITransactionService
{
    Task<Result<TransactionDto>> Create(TransactionDto transactionDto, CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> GetById(Guid id, CancellationToken cancellationToken = default);

    Task<Result<List<TransactionDto>>> GetAll(CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> Update(Guid id, TransactionDto transactionDto, CancellationToken cancellationToken = default);

    Task<Result<bool>> Delete(Guid id, CancellationToken cancellationToken = default);
}
