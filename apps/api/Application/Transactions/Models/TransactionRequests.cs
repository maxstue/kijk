using Kijk.Shared;

namespace Kijk.Application.Transactions.Models;

public record CreateTransactionRequest(string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, Guid? AccountId, Guid? CategoryId);

public record UpdateTransactionRequest(string? Name, decimal? Amount, TransactionType? Type, DateTime? ExecutedAt, Guid? CategoryId);