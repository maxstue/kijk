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
            .NotNull().WithErrorCode(ErrorCodes.ValidationError)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.HouseholdName)
            .NotNull().WithErrorCode(ErrorCodes.ValidationError)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.AnalyticsConsent)
            .NotNull().WithErrorCode(ErrorCodes.ValidationError)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
    }
}