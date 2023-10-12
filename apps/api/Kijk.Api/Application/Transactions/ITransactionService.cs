using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public interface ITransactionService
{
    Task<Result<List<TransactionDto>>> GetBy(int year, string month, CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> GetById(Guid id, CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> Create(CreateTransactionRequest transactionDto, CancellationToken cancellationToken = default);

    Task<Result<TransactionDto>> Update(Guid id, UpdateTransactionRequest transactionDto, CancellationToken cancellationToken = default);

    Task<Result<bool>> Delete(Guid id, CancellationToken cancellationToken = default);
}
