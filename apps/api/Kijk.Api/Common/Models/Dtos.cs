using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Common.Models;

public record TransactionDto(Guid Id, string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, IEnumerable<CategoryDto> Categories);

public record CategoryDto(Guid Id, string Name, string Color);
