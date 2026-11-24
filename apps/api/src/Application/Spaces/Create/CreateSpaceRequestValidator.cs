using Kijk.Shared;

namespace Kijk.Application.Spaces.Create;

/// <summary>
/// Validates new spaces with the same rules as space detail updates.
/// </summary>
public sealed class CreateSpaceRequestValidator : AbstractValidator<CreateSpaceRequest>
{
    /// <summary>
    /// Creates the space creation validator.
    /// </summary>
    public CreateSpaceRequestValidator()
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