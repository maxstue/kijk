using Kijk.Application.Shared.Csv;

namespace Kijk.Application.Consumptions.Import;

/// <summary>
/// The result of a consumption import. The file is imported completely or not at all: when
/// <paramref name="ErrorCount" /> is greater than zero, nothing was saved.
/// </summary>
/// <param name="ImportedCount">The number of saved consumptions.</param>
/// <param name="SkippedCount">The number of rows skipped because the same consumption already exists.</param>
/// <param name="ErrorCount">The number of rows that could not be imported.</param>
/// <param name="ErrorSamples">The first row errors, without the original row content.</param>
public sealed record ConsumptionImportResponse(
    int ImportedCount,
    int SkippedCount,
    int ErrorCount,
    List<CsvRowErrorResponse> ErrorSamples);