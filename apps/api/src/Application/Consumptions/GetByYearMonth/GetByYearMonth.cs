using System.Globalization;
using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Consumptions.Shared;
using Kijk.Shared;
using Kijk.Shared.Extensions;

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

        var response = await dbContext.Consumptions
            .AsNoTracking()
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .If(year != null, q => q.Where(x => x.Date.Value.Year == year))
            .If(monthInt != -1, q => q.Where(x => x.Date.Value.Month == monthInt))
            .ToResponse()
            .ToListAsync(cancellationToken);

        return response;
    }
}