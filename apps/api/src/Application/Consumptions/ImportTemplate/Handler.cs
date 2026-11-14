using Kijk.Application.Consumptions.Export;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Consumptions.ImportTemplate;

/// <summary>
/// Handler for the CSV template of the consumption import.
/// </summary>
public sealed class ImportTemplateHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Creates a template in the export format with one example meter reading per resource available in the active
    /// space, so the file shows the exact resource names and units the import accepts.
    /// </summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The CSV template.</returns>
    public async Task<Result<ConsumptionCsvExport>> HandleAsync(CancellationToken cancellationToken)
    {
        var today = timeProvider.GetUtcNow().UtcDateTime.Date;
        var resources = await dbContext.GetUserAvailableResources(currentUser)
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .Select(item => new ConsumptionResourceResponse(item.Id, item.Name, item.Unit.Symbol, item.Color, item.Icon))
            .ToListAsync(cancellationToken);

        var examples = resources.Select(resource => new ConsumptionResponse(
            Guid.Empty,
            $"{resource.Name} reading",
            null,
            100m,
            ConsumptionValueType.Absolute,
            false,
            0m,
            resource,
            today));

        return new ConsumptionCsvExport(ConsumptionCsvWriter.Write(examples), "consumptions-import-template.csv");
    }
}