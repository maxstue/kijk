using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
///     Converts all datetime values in the database to UTC.
/// </summary>
public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    /// <summary>Creates the converter.</summary>
    public UtcDateTimeConverter()
        : base(v => DateTime.SpecifyKind(v, DateTimeKind.Utc), v => v)
    {
    }
}