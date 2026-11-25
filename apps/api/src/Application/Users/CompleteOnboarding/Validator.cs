using Kijk.Application.Spaces.Shared;
using Kijk.Shared;

namespace Kijk.Application.Users.CompleteOnboarding;

/// <summary>
/// Validates requests that complete onboarding.
/// </summary>
public sealed class WelcomeUserRequestValidator : AbstractValidator<WelcomeUserRequest>
{
    /// <summary>Creates the validator rules for onboarding requests.</summary>
    public WelcomeUserRequestValidator()
    {
        RuleFor(request => request.DisplayName)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .Must(name => !string.IsNullOrWhiteSpace(name.Trim())).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError);

        // The personal space keeps its default name when none is given.
        RuleFor(request => request.SpaceName!.Trim())
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError)
            .OverridePropertyName(nameof(WelcomeUserRequest.SpaceName))
            .When(request => request.SpaceName is not null);

        RuleFor(request => request.InvitationToken)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .MaximumLength(InvitationToken.MaxLength).WithErrorCode(ErrorCodes.ValidationError)
            .When(request => request.InvitationToken is not null);

        RuleFor(request => request.AnalyticsConsent)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
    }
}