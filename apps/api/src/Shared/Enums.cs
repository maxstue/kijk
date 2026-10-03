using NetEscapades.EnumGenerators;

namespace Kijk.Shared;

/// <summary>
/// Represents who was the creator of the object.
/// </summary>
[EnumExtensions]
public enum CreatorType
{
    /// <summary>Created and maintained by Kijk.</summary>
    System,
    /// <summary>Created by a user.</summary>
    User
}

/// <summary>
/// Represents a period of time.
/// </summary>
[EnumExtensions]
public enum Period
{
    /// <summary>A calendar month.</summary>
    Month,
    /// <summary>A calendar quarter.</summary>
    Quarter,
    /// <summary>A calendar year.</summary>
    Year
}

/// <summary>
/// Represents the user's analytics collection preference.
/// </summary>
[EnumExtensions]
public enum AnalyticsConsent
{
    /// <summary>The user allows analytics.</summary>
    Accepted,
    /// <summary>The user does not allow analytics.</summary>
    Declined
}