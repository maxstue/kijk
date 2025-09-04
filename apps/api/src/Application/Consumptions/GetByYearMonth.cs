using System.Globalization;
using Kijk.Application.Consumptions.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;

namespace Kijk.Application.Consumptions;

/// <summary>
/// Handler for getting consumptions by year and month.
/// </summary>
public class GetByYearMonthHandler(AppDbContext dbContext, CurrentUser currentUser)
{
    public async Task<Result<List<ConsumptionResponse>>> GetByYearMonthAsync(int? year, string? month, CancellationToken cancellationToken)
    {
        var monthInt = month is not null ? DateTime.ParseExact(month, "MMMM", CultureInfo.InvariantCulture).Month : -1;

        var response = await dbContext.Consumptions
            .AsNoTracking()
            .Include(x => x.Resource)
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .If(year != null, q => q.Where(x => x.Date.Value.Year == year))
            .If(monthInt != -1, q => q.Where(x => x.Date.Value.Month == monthInt))
            .Select(x => new ConsumptionResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Value,
                new(x.Resource.Id, x.Resource.Name, x.Resource.Unit, x.Resource.Color),
                x.Date.ToDateTime()))
            .ToListAsync(cancellationToken);

        return response;
    }
}