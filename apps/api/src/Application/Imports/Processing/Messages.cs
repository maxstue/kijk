// Keep message namespaces stable: persisted Wolverine envelopes refer to these type identities.
namespace Kijk.Application.Imports.Shared;

/// <summary>Detects the format of an uploaded file and proposes a mapping.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record AnalyzeImport(Guid ImportJobId);

/// <summary>Reads the whole file with the confirmed mapping into candidates.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record ReadImport(Guid ImportJobId);

/// <summary>Proposes categories with the AI for the candidates that have none.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record CategorizeImport(Guid ImportJobId);