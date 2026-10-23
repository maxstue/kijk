using Kijk.Shared;

namespace Kijk.Application.Users.Feedback;

/// <summary>Limits feedback to a non-empty, bounded message.</summary>
public sealed class FeedbackRequestValidator : AbstractValidator<FeedbackRequest>
{
    /// <summary>Creates the validation rules.</summary>
    public FeedbackRequestValidator()
    {
        RuleFor(request => request.Message)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .Must(message => message is not null && message.Trim().Length >= 2).WithErrorCode(ErrorCodes.ValidationError)
            .MaximumLength(4000).WithErrorCode(ErrorCodes.ValidationError);
    }
}