using Kijk.Shared;

namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Validates requests that name an invitation by its token.
/// </summary>
public sealed class InvitationTokenRequestValidator : AbstractValidator<InvitationTokenRequest>
{
    /// <summary>Creates the validator rules for invitation tokens.</summary>
    public InvitationTokenRequestValidator()
    {
        RuleFor(request => request.Token)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .MaximumLength(InvitationToken.MaxLength).WithErrorCode(ErrorCodes.ValidationError);
    }
}