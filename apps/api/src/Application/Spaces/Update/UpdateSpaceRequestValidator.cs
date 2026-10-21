using Kijk.Shared;

namespace Kijk.Application.Spaces.Update;

/// <summary>
/// Validates space detail updates.
/// </summary>
public sealed class UpdateSpaceRequestValidator : AbstractValidator<UpdateSpaceRequest>
{
    /// <summary>
    /// Creates the space update validator.
    /// </summary>
    public UpdateSpaceRequestValidator()
    {
        RuleFor(request => request.Name)
            .Must(name => !string.IsNullOrWhiteSpace(name))
            .Length(2, 100)
            .WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.Description)
            .MaximumLength(250)
            .WithErrorCode(ErrorCodes.ValidationError);
    }
}