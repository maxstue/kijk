using Kijk.Application.Imports.AiDataPreview;
using Kijk.Application.Imports.Cancel;
using Kijk.Application.Imports.Categorization;
using Kijk.Application.Imports.Cleanup;
using Kijk.Application.Imports.Commit;
using Kijk.Application.Imports.ConfirmMapping;
using Kijk.Application.Imports.Detection;
using Kijk.Application.Imports.Processing;
using Kijk.Application.Imports.Queries;
using Kijk.Application.Imports.Settings;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Imports.Start;
using Kijk.Application.Imports.StartCategorization;
using Kijk.Application.Imports.UpdateCandidate;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Imports;

/// <summary>Registers the handlers and services owned by the Imports feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<AiDataPreviewHandler>();
        services.AddScoped<CancelHandler>();
        services.AddScoped<StartCategorizationHandler>();
        services.AddScoped<CleanupImportsHandler>();
        services.AddScoped<CommitHandler>();
        services.AddScoped<ConfirmMappingHandler>();
        services.AddScoped<StartHandler>();
        services.AddScoped<QueriesHandler>();
        services.AddScoped<ImportCategorizationProcessor>();
        services.AddScoped<ImportJobProcessor>();
        services.AddScoped<UpdateCandidateHandler>();
        services.AddScoped<SettingsHandler>();
        services.AddScoped<ImportFileReader>();
        services.AddScoped<ICsvFormatDetector, AiCsvFormatDetector>();
        services.AddScoped<ITransactionCategorizer, AiTransactionCategorizer>();

        return services;
    }
}