using Kijk.Domain.ValueObjects;

namespace Kijk.Domain.Services;

/// <summary>
/// Determines which months a bank export covers. Months between the first and the last booking are covered
/// completely; the first and the last month may only be covered partly, so the user decides about them.
/// </summary>
public static class ImportCoverage
{
    /// <summary>Splits the months of the given booking dates into full and edge months.</summary>
    /// <param name="bookingDates">The booking dates of all valid rows.</param>
    /// <returns>The full months and the edge months, each as the first day of the month (UTC).</returns>
    public static (List<DateTime> FullMonths, List<DateTime> EdgeMonths) Analyze(IEnumerable<DateTime> bookingDates)
    {
        var dates = bookingDates.ToList();
        if (dates.Count == 0)
        {
            return ([], []);
        }

        var first = new MonthYear(dates.Min()).ToDateTime();
        var last = new MonthYear(dates.Max()).ToDateTime();
        var full = new List<DateTime>();
        for (var month = first.AddMonths(1); month < last; month = month.AddMonths(1))
        {
            full.Add(month);
        }

        return (full, first == last ? [first] : [first, last]);
    }
}