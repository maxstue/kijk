using Kijk.Shared;

namespace Kijk.Application.Households.Update;

/// <summary>
/// Validates household detail updates.
/// </summary>
public sealed class UpdateHouseholdRequestValidator : AbstractValidator<UpdateHouseholdRequest>
{
    /// <summary>
    /// Creates the household update validator.
    /// </summary>
    public UpdateHouseholdRequestValidator()
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