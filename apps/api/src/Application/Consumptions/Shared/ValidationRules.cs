namespace Kijk.Application.Consumptions.Shared;

/// <summary>
/// Defines validation constraints shared by recorded, updated and imported consumptions.
/// </summary>
public static class ConsumptionValidationRules
{
    /// <summary>Minimum allowed consumption name length.</summary>
    public const int NameMinimumLength = 2;

    /// <summary>Maximum allowed consumption name length.</summary>
    public const int NameMaximumLength = 50;

    /// <summary>Maximum allowed description length.</summary>
    public const int DescriptionMaximumLength = 250;
}