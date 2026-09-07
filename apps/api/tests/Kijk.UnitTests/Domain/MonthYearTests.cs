using Kijk.Domain.ValueObjects;

namespace Kijk.UnitTests.Domain;

public class MonthYearTests
{
    [Test]
    public async Task ConstructorNormalizesValueToFirstDayOfMonthInUtc()
    {
        var value = new DateTime(2026, 9, 17, 14, 30, 0, DateTimeKind.Local);

        var result = new MonthYear(value);

        await Assert.That(result.Value).IsEqualTo(new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc));
    }

    [Test]
    public async Task ParseStringWithValidValueReturnsExpectedMonthAndYear()
    {
        var result = MonthYear.ParseString("01-12-2025");

        await Assert.That(result.Month).IsEqualTo(12);
        await Assert.That(result.Year).IsEqualTo(2025);
        await Assert.That(result.ToString()).IsEqualTo("01-12-2025");
    }

    [Test]
    public async Task ParseDateTimePreservesOnlyMonthAndYear()
    {
        var first = MonthYear.ParseDateTime(new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc));
        var last = MonthYear.ParseDateTime(new DateTime(2026, 3, 31, 23, 59, 59, DateTimeKind.Utc));

        await Assert.That(first).IsEqualTo(last);
    }
}