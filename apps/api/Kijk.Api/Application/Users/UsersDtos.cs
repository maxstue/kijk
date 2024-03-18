using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Users;

public record UserSmallResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime);

public record UserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    IEnumerable<UserHouseholdDto>? Households,
    IEnumerable<BudgetDto>? Budgets,
    IEnumerable<AccountDto>? Accounts,
    IEnumerable<CategoryDto>? Categories);

public record UserInitRequest(string? UserName, bool? UseDefaultCategories);

public record UserUpdateRequest(string? UserName, bool? UseDefaultCategories);
