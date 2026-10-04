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

/// <summary>
/// Represents whether a category groups expenses or income.
/// </summary>
[EnumExtensions]
public enum CategoryKind
{
    /// <summary>Spending that counts against a budget.</summary>
    Expense,
    /// <summary>Income that is evaluated separately from budgets.</summary>
    Income
}

/// <summary>
/// Represents how the category of a transaction was assigned.
/// </summary>
[EnumExtensions]
public enum CategorySource
{
    /// <summary>Assigned by a category rule.</summary>
    Rule,
    /// <summary>Taken from the most similar categorized transaction.</summary>
    Similarity,
    /// <summary>Suggested by the AI categorization.</summary>
    Ai,
    /// <summary>Set by a user. Automatic categorization never overwrites it.</summary>
    Manual
}

/// <summary>
/// Represents the booking status of a transaction.
/// </summary>
[EnumExtensions]
public enum TransactionStatus
{
    /// <summary>The bank has booked the transaction. Only booked transactions count against budgets.</summary>
    Booked,
    /// <summary>The bank has reserved the amount but not booked it yet.</summary>
    Pending
}