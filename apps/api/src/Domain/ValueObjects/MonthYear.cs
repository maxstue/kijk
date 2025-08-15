namespace Kijk.Domain.ValueObjects;

/// <summary>
/// Represents a month and year value object.
/// </summary>
public sealed record MonthYear
{
    public int Year => Value.Year;
    public int Month => Value.Month;
    /// <summary>
    /// The actual date time value of the month and year.
    /// Use this property to query the database.
    /// </summary>
    public DateTime Value { get; init; }

    public MonthYear(DateTime value) => Value = new DateTime(value.Year, value.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    private MonthYear(int month, int year)
    {
        if (month is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(month), "Month must be between 1 and 12.");
        }

        Value = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    public override string ToString() => Value.ToString("dd-MM-yyyy");

    public static MonthYear ParseDateTime(DateTime dateTime) => new(dateTime);
    public static MonthYear CreateEmpty() => new(1, 0);
    public static MonthYear ParseString(string value)
    {
        var parts = value.Split('-');
        return parts.Length != 3
            ? throw new FormatException("Invalid MonthYear format. Expected 'dd-MM-yyyy'.")
            : new(int.Parse(parts[1]), int.Parse(parts[2]));
    }

    public DateTime ToDateTime() => Value;
}