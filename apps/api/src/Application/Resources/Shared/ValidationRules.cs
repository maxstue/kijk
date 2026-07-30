namespace Kijk.Application.Resources.Shared;

/// <summary>
/// Defines validation constraints shared by resource create and update requests.
/// </summary>
public static class ResourceValidationRules
{
    /// <summary>Minimum allowed resource name length.</summary>
    public const int NameMinimumLength = 2;

    /// <summary>Maximum allowed resource name length.</summary>
    public const int NameMaximumLength = 30;

    /// <summary>Minimum allowed resource unit length.</summary>
    public const int UnitMinimumLength = 1;

    /// <summary>Maximum allowed resource unit length.</summary>
    public const int UnitMaximumLength = 10;

    /// <summary>Pattern accepted for resource colors.</summary>
    public const string HexColorPattern = "^#[0-9a-fA-F]{6}$";
}