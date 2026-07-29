using Kijk.Shared;

namespace Kijk.Application.Users.Update;

/// <summary>
/// Validates requests that update the current user's profile and privacy settings.
/// </summary>
public sealed class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(request => request.UserName)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError)
            .When(request => request.UserName is not null);

        RuleFor(request => request.HouseholdName)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError)
            .When(request => request.HouseholdName is not null);

        RuleFor(request => request.AnalyticsConsent)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError)
            .When(request => request.AnalyticsConsent is not null);
    }
}