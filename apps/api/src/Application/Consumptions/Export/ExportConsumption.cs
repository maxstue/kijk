using System.Globalization;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Consumptions.Export;

/// <summary>
/// Handles server-side CSV exports for consumptions.
/// </summary>
public sealed class ExportConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Exports a single consumption owned by the active household.
    /// </summary>
    /// <param name="id">The consumption identifier.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns>The CSV file, or a not-found error.</returns>
    public async Task<Result<ConsumptionCsvExport>> ExportByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var consumption = await dbContext.Consumptions
            .AsNoTracking()
            .Where(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId)
            .ToResponse()
            .SingleOrDefaultAsync(cancellationToken);

        if (consumption is null)
        {
            return Error.NotFound("Consumption not found.");
        }

        var fileName = $"consumption-{consumption.Date:yyyy-MM-dd}-{consumption.Id}.csv";
        return new ConsumptionCsvExport(ConsumptionCsvWriter.Write([consumption]), fileName);
    }

    /// <summary>
    /// Exports all consumptions for a month owned by the active household.
    /// </summary>
    /// <param name="year">The four-digit year.</param>
    /// <param name="month">The invariant English month name.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns>The generated CSV file, or a validation error.</returns>
    public async Task<Result<ConsumptionCsvExport>> ExportMonthAsync(int year, string month, CancellationToken cancellationToken)
    {
        if (year is < 1 or > 9999)
        {
            return Error.Validation($"Year '{year}' is invalid.");
        }

        if (!DateTime.TryParseExact(month, "MMMM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedMonth))
        {
            return Error.Validation($"Month '{month}' is invalid.");
        }

        var consumptions = await dbContext.Consumptions
            .AsNoTracking()
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(item => item.Date.Year == year && item.Date.Month == parsedMonth.Month)
            .OrderByDescending(item => item.Date)
            .ThenBy(item => item.Id)
            .ToResponse()
            .ToListAsync(cancellationToken);

        var fileName = $"consumptions-{year:D4}-{parsedMonth.Month:D2}.csv";
        return new ConsumptionCsvExport(ConsumptionCsvWriter.Write(consumptions), fileName);
    }
}