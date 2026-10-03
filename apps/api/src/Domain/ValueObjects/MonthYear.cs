namespace Kijk.Domain.ValueObjects;

/// <summary>
/// Represents a month and year value object.
/// </summary>
public sealed record MonthYear
{
    /// <summary>Gets the year.</summary>
    public int Year => Value.Year;
    /// <summary>Gets the month (1-12).</summary>
    public int Month => Value.Month;
    /// <summary>
    /// The actual date time value of the month and year.
    /// Use this property to query the database.
    /// </summary>
    public DateTime Value { get; init; }

    /// <summary>Creates the month of the given date.</summary>
    /// <param name="value">Any date in the month.</param>
    public MonthYear(DateTime value) => Value = new(value.Year, value.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    private MonthYear(int month, int year)
    {
        if (month is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(month), "Month must be between 1 and 12.");
        }

        Value = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    /// <summary>Formats the value as <c>dd-MM-yyyy</c> (day is always 01).</summary>
    /// <returns>The formatted value.</returns>
    public override string ToString() => Value.ToString("dd-MM-yyyy");

    /// <summary>Creates the month of the given date.</summary>
    /// <param name="dateTime">Any date in the month.</param>
    /// <returns>The month.</returns>
    public static MonthYear ParseDateTime(DateTime dateTime) => new(dateTime);
    /// <summary>Creates an empty placeholder value.</summary>
    /// <returns>The placeholder.</returns>
    public static MonthYear CreateEmpty() => new(1, 0);
    /// <summary>Parses a value formatted by <see cref="ToString" />.</summary>
    /// <param name="value">A <c>dd-MM-yyyy</c> string.</param>
    /// <returns>The month.</returns>
    /// <exception cref="FormatException">The value is not in the expected format.</exception>
    public static MonthYear ParseString(string value)
    {
        var parts = value.Split('-');
        return parts.Length != 3
            ? throw new FormatException("Invalid MonthYear format. Expected 'dd-MM-yyyy'.")
            : new(int.Parse(parts[1]), int.Parse(parts[2]));
    }

    /// <summary>Gets the first day of the month as UTC date.</summary>
    /// <returns>The date.</returns>
    public DateTime ToDateTime() => Value;
}