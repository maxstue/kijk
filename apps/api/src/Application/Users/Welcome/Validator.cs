using Kijk.Shared;

namespace Kijk.Application.Users.Welcome;

/// <summary>
/// Validates requests that complete onboarding.
/// </summary>
public sealed class WelcomeUserRequestValidator : AbstractValidator<WelcomeUserRequest>
{
    public WelcomeUserRequestValidator()
    {
        RuleFor(request => request.DisplayName)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .Must(name => !string.IsNullOrWhiteSpace(name.Trim())).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.HouseholdName)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .Must(name => !string.IsNullOrWhiteSpace(name.Trim())).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.AnalyticsConsent)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
    }
}