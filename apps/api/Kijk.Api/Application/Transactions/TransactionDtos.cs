using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public record TransactionDto(Guid Id, string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, IEnumerable<CategoryDto> Categories);

public record CreateTransactionRequest(string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, IEnumerable<Guid>? CategoryIds);

public record UpdateTransactionRequest(string? Name, decimal? Amount, TransactionType? Type, DateTime? ExecutedAt, IEnumerable<Guid>? CategoryIds);

public record CategoryDto(Guid Id, string Name, string Color);
