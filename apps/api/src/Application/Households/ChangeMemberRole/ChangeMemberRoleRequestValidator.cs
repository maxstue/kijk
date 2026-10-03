using Kijk.Shared;

namespace Kijk.Application.Households.ChangeMemberRole;

/// <summary>
/// Validates member role changes.
/// </summary>
public sealed class ChangeMemberRoleRequestValidator : AbstractValidator<ChangeMemberRoleRequest>
{
    /// <summary>
    /// Creates the member role change validator.
    /// </summary>
    public ChangeMemberRoleRequestValidator()
    {
        RuleFor(request => request.RoleId)
            .NotEmpty()
            .WithErrorCode(ErrorCodes.ValidationError);
    }
}