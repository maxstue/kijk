using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Users;

public record UserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    IEnumerable<TransactionDto> Transactions,
    IEnumerable<CategoryDto> Categories);
