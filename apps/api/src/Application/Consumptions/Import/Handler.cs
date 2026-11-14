using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Limits.Shared;
using Kijk.Application.Shared.Csv;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Import;

/// <summary>
/// Handler for importing consumptions from a CSV file.
/// </summary>
public sealed class ImportHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider, ILogger<ImportHandler> logger)
{
    /// <summary>
    /// Imports all rows of a file into the active space, or none when a row is invalid. Rows that match an existing
    /// consumption (same resource, day, value type and value) are skipped, so the same file can be imported again.
    /// </summary>
    /// <param name="content">The file content.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The import result, or a validation error when the file cannot be read.</returns>
    public async Task<Result<ConsumptionImportResponse>> HandleAsync(Stream content, CancellationToken cancellationToken)
    {
        var bytes = await ReadAsync(content, cancellationToken);
        if (bytes is null)
        {
            return Error.Validation($"The file must not be larger than {ConsumptionImportLimits.MaxFileBytes / 1024 / 1024} MB");
        }

        if (bytes.Length == 0)
        {
            return Error.Validation("The file is empty");
        }

        var space = await dbContext.Spaces.FirstOrDefaultAsync(item => item.Id == currentUser.ActiveSpaceId, cancellationToken);
        if (space is null)
        {
            logger.LogWarning("Space with id {SpaceId} not found", currentUser.ActiveSpaceId);
            return Error.NotFound("Space not found");
        }

        var file = ConsumptionCsvReader.Read(bytes);
        if (file.IsError)
        {
            return file.Error;
        }

        var resources = await dbContext.GetUserAvailableResources(currentUser).Include(item => item.Unit).ToListAsync(cancellationToken);
        var errors = file.Value.Errors.ToList();
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var rows = new List<(ConsumptionCsvRow Row, Resource Resource, string Name)>();
        foreach (var row in file.Value.Rows)
        {
            var rowErrors = new List<string>();
            var resource = ResolveResource(row, resources, rowErrors);
            var name = row.Name ?? resource?.Name;
            if (name?.Length is < ConsumptionValidationRules.NameMinimumLength or > ConsumptionValidationRules.NameMaximumLength)
            {
                rowErrors.Add($"{ConsumptionCsvColumns.Name} must be between {ConsumptionValidationRules.NameMinimumLength} and {ConsumptionValidationRules.NameMaximumLength} characters long");
            }

            if (row.Date > now.Date)
            {
                rowErrors.Add($"{ConsumptionCsvColumns.Date} must not be in the future");
            }

            if (rowErrors.Count > 0 || resource is null || name is null)
            {
                errors.Add(new CsvRowErrorResponse(row.RowNumber, string.Join("; ", rowErrors)));
                continue;
            }

            rows.Add((row, resource, name));
        }

        if (errors.Count > 0)
        {
            return Rejected(errors);
        }

        var resourceIds = rows.Select(item => item.Resource.Id).Distinct().ToList();
        var existing = await dbContext.Consumptions
            .Where(item => item.SpaceId == space.Id && resourceIds.Contains(item.ResourceId))
            .ToListAsync(cancellationToken);
        var before = LimitOccurrence.Capture(existing);
        var known = existing.Select(Key).ToHashSet();
        var imported = new List<(Consumption Consumption, int RowNumber)>();
        foreach (var (row, resource, name) in rows)
        {
            var consumption = Consumption.Create(
                name,
                resource,
                space,
                row.Date,
                new ConsumptionReading(row.Value, row.ValueType, CalculatedConsumption: 0m, row.StartsNewMeterSegment),
                row.Description);
            consumption.ResourceId = resource.Id;
            if (!known.Add(Key(consumption)))
            {
                continue;
            }

            // An explicit creation time keeps the file order for entries on the same day, before and after saving.
            consumption.CreatedAt = now.AddTicks(imported.Count);
            imported.Add((consumption, row.RowNumber));
        }

        foreach (var group in imported.GroupBy(item => item.Consumption.ResourceId))
        {
            var timeline = existing.Where(item => item.ResourceId == group.Key).Concat(group.Select(item => item.Consumption));
            if (ConsumptionTimelineCalculator.RecalculateUntilInvalid(timeline) is { } invalid)
            {
                errors.Add(new CsvRowErrorResponse(RowNumberOf(invalid.Consumption, group.ToList()), invalid.Error.Description));
            }
        }

        if (errors.Count > 0)
        {
            return Rejected(errors);
        }

        dbContext.Consumptions.AddRange(imported.Select(item => item.Consumption));
        await LimitOccurrence.RecordAsync(
            dbContext,
            space.Id,
            before,
            existing.Concat(imported.Select(item => item.Consumption)).ToList(),
            now,
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var skipped = rows.Count - imported.Count;
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Imported {ImportedCount} consumptions and skipped {SkippedCount} existing ones", imported.Count, skipped);
        }
        return new ConsumptionImportResponse(imported.Count, skipped, 0, []);
    }

    private static Resource? ResolveResource(ConsumptionCsvRow row, IReadOnlyList<Resource> resources, List<string> errors)
    {
        var matches = resources
            .Where(item => string.Equals(item.Name, row.Resource, StringComparison.OrdinalIgnoreCase))
            .Where(item => row.Unit is null || string.Equals(item.Unit.Symbol, row.Unit, StringComparison.OrdinalIgnoreCase))
            .ToList();
        switch (matches.Count)
        {
            case 1:
                return matches[0];
            case 0:
                errors.Add(row.Unit is null
                    ? $"Resource '{row.Resource}' is not available in this space"
                    : $"Resource '{row.Resource}' with unit '{row.Unit}' is not available in this space");
                return null;
            default:
                errors.Add($"Resource '{row.Resource}' exists with several units; add the {ConsumptionCsvColumns.Unit} column");
                return null;
        }
    }

    // A decreasing reading of an existing entry is caused by the latest imported row before it.
    private static int RowNumberOf(Consumption consumption, List<(Consumption Consumption, int RowNumber)> timeline)
    {
        var own = timeline.FindIndex(item => item.Consumption == consumption);
        if (own >= 0)
        {
            return timeline[own].RowNumber;
        }

        var preceding = timeline.Where(item => item.Consumption.Date <= consumption.Date).ToList();
        return preceding.Count > 0 ? preceding.MaxBy(item => item.Consumption.Date).RowNumber : timeline[0].RowNumber;
    }

    private static (Guid ResourceId, DateTime Date, ConsumptionValueType ValueType, decimal Value) Key(Consumption consumption) =>
        (consumption.ResourceId, consumption.Date, consumption.ValueType, consumption.Value);

    private static ConsumptionImportResponse Rejected(List<CsvRowErrorResponse> errors) =>
        new(0, 0, errors.Count, errors.OrderBy(item => item.RowNumber).Take(ConsumptionImportLimits.ErrorSamples).ToList());

    private static async Task<byte[]?> ReadAsync(Stream content, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[81_920];
        int read;
        while ((read = await content.ReadAsync(chunk, cancellationToken)) > 0)
        {
            if (buffer.Length + read > ConsumptionImportLimits.MaxFileBytes)
            {
                return null;
            }

            await buffer.WriteAsync(chunk.AsMemory(0, read), cancellationToken);
        }

        return buffer.ToArray();
    }
}