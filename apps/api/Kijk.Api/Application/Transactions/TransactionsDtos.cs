using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public record CreateTransactionRequest(string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, Guid AccountId, Guid? CategoryId);

public record UpdateTransactionRequest(string? Name, decimal? Amount, TransactionType? Type, DateTime? ExecutedAt, Guid? CategoryId);

public record YearDto(List<int> Years);
