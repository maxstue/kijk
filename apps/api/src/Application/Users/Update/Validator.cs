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
            .Must(name => !string.IsNullOrWhiteSpace(name))
            .When(request => request.UserName is not null)
            .WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100)
            .When(request => request.UserName is not null)
            .WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.HouseholdName)
            .Must(name => !string.IsNullOrWhiteSpace(name))
            .When(request => request.HouseholdName is not null)
            .WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100)
            .When(request => request.HouseholdName is not null)
            .WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.AnalyticsConsent)
            .IsInEnum()
            .When(request => request.AnalyticsConsent is not null)
            .WithErrorCode(ErrorCodes.ValidationError);
    }
}