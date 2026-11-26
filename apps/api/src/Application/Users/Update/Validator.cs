using Kijk.Shared;

namespace Kijk.Application.Users.Update;

/// <summary>
/// Validates requests that update the current user's profile and privacy settings.
/// </summary>
public sealed class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    /// <summary>Creates the validator rules for user updates.</summary>
    public UpdateUserRequestValidator()
    {
        RuleFor(request => request.UserName)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError)
            .Must(name => name.IndexOfAny(['#', '@']) < 0 && !name.Any(char.IsControl)).WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("The name must not contain '#', '@' or control characters, because it becomes part of the unique name (Max#4821).")
            .When(request => request.UserName is not null);

        RuleFor(request => request.AnalyticsConsent)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError)
            .When(request => request.AnalyticsConsent is not null);
    }
}