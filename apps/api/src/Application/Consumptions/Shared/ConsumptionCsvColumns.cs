namespace Kijk.Application.Consumptions.Shared;

/// <summary>
/// The column names of the consumption CSV format, shared by export, import and the import template.
/// </summary>
public static class ConsumptionCsvColumns
{
    /// <summary>The calendar day as <c>yyyy-MM-dd</c>.</summary>
    public const string Date = "Date";

    /// <summary>The display name of the entry.</summary>
    public const string Name = "Name";

    /// <summary>The name of the consumed resource.</summary>
    public const string Resource = "Resource";

    /// <summary>The unit of the resource; distinguishes resources with the same name.</summary>
    public const string Unit = "Unit";

    /// <summary>Whether the value is a meter reading (<c>Absolute</c>) or the consumed amount (<c>Relative</c>).</summary>
    public const string ValueType = "ValueType";

    /// <summary>The entered value.</summary>
    public const string Value = "Value";

    /// <summary>Whether a meter reading starts a new meter segment, e.g. after a meter replacement (<c>true</c>/<c>false</c>).</summary>
    public const string StartsNewMeterSegment = "StartsNewMeterSegment";

    /// <summary>The calculated consumption; exported only, ignored on import.</summary>
    public const string CalculatedConsumption = "CalculatedConsumption";

    /// <summary>An optional description.</summary>
    public const string Description = "Description";
}