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

/// <summary>
/// Represents the kind of a household account.
/// </summary>
[EnumExtensions]
public enum AccountKind
{
    /// <summary>A bank account whose transactions are imported from bank exports.</summary>
    Bank,
    /// <summary>The household's cash account for manually recorded transactions. Imports never change it.</summary>
    Cash
}

/// <summary>
/// Represents the processing state of a CSV import.
/// </summary>
[EnumExtensions]
public enum ImportJobStatus
{
    /// <summary>The file is stored and waits for the analysis.</summary>
    Pending,
    /// <summary>The format of the file is being detected.</summary>
    Analyzing,
    /// <summary>The column mapping waits for the user's confirmation.</summary>
    NeedsMapping,
    /// <summary>The whole file is being read into candidates.</summary>
    Reading,
    /// <summary>The candidates wait for the user's review.</summary>
    NeedsReview,
    /// <summary>The candidates were committed as transactions.</summary>
    Done,
    /// <summary>The import failed or expired.</summary>
    Failed,
    /// <summary>The user cancelled the import.</summary>
    Cancelled,
    /// <summary>The AI proposes categories for the candidates that have none.</summary>
    Categorizing
}

/// <summary>
/// Represents where a proposed column mapping came from.
/// </summary>
[EnumExtensions]
public enum MappingSource
{
    /// <summary>A confirmed profile of the same file format.</summary>
    Profile,
    /// <summary>A suggestion derived from the column names.</summary>
    Suggestion,
    /// <summary>Detected by the AI from masked value patterns; it never sees the file content.</summary>
    Ai
}

/// <summary>
/// Represents what a category rule matches on.
/// </summary>
[EnumExtensions]
public enum CategoryRuleScope
{
    /// <summary>The normalized name of a merchant, for transactions without a counterparty IBAN.</summary>
    Merchant,
    /// <summary>The pseudonymous key of the counterparty IBAN. Used for people and companies alike.</summary>
    Counterparty,
    /// <summary>A word of the purpose text the user chose, e.g. "miete". Contains nothing about the counterparty.</summary>
    Keyword
}

/// <summary>
/// Represents how a category rule was created.
/// </summary>
[EnumExtensions]
public enum CategoryRuleOrigin
{
    /// <summary>A user chose to remember a correction.</summary>
    User,
    /// <summary>Kijk learned the rule from corrections.</summary>
    Learned
}

/// <summary>
/// Represents how much of the purpose text a household keeps after an import.
/// </summary>
[EnumExtensions]
public enum PurposeRetention
{
    /// <summary>Keeps the cleaned purpose.</summary>
    Keep,
    /// <summary>Keeps only the beginning of the cleaned purpose.</summary>
    Truncate,
    /// <summary>Does not store the purpose.</summary>
    Remove
}

/// <summary>
/// Represents which transaction data a household lets the AI categorization see.
/// </summary>
[EnumExtensions]
public enum AiDataSharing
{
    /// <summary>No transaction leaves the server.</summary>
    Off,
    /// <summary>Counterparty and purpose are sent after removing identifiers and the names of private persons.</summary>
    Strict
}