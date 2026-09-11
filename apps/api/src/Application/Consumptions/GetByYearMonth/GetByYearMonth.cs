using System.Globalization;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Services;
using Kijk.Shared;

namespace Kijk.Application.Consumptions.GetByYearMonth;

/// <summary>
/// Handler for getting consumptions by year and month.
/// </summary>
public class GetByYearMonthHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    public async Task<Result<List<ConsumptionResponse>>> GetByYearMonthAsync(int? year, string? month, CancellationToken cancellationToken)
    {
        var monthInt = -1;
        if (month is not null)
        {
            if (!DateTime.TryParseExact(month, "MMMM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedMonth))
            {
                return Error.Validation($"Month '{month}' is invalid");
            }

            monthInt = parsedMonth.Month;
        }

        var consumptions = await dbContext.Consumptions
            .AsNoTracking()
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Include(x => x.Resource)
            .ToListAsync(cancellationToken);

        var calculatedMeterReadings = consumptions
            .GroupBy(item => item.ResourceId)
            .SelectMany(group => ConsumptionTimelineCalculator.CalculateMeterReadings(group))
            .ToDictionary(item => item.Key, item => item.Value);

        var response = consumptions
            .Where(item => year is null || item.Date.Year == year)
            .Where(item => monthInt == -1 || item.Date.Month == monthInt)
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Select(item => item.ToResponse() with { CalculatedMeterReading = calculatedMeterReadings[item.Id] })
            .ToList();

        return response;
    }
}