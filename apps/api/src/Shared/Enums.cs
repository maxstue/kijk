using NetEscapades.EnumGenerators;

namespace Kijk.Shared;

/// <summary>
/// Represents who was the creator of the object.
/// </summary>
[EnumExtensions]
public enum CreatorType
{
    System,
    User
}

/// <summary>
/// Represents a period of time.
/// </summary>
[EnumExtensions]
public enum Period
{
    Month,
    Quarter,
    Year
}