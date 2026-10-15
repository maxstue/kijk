using Kijk.Application.Imports.AiPreview;
using Kijk.Application.Imports.Cancel;
using Kijk.Application.Imports.Categorization;
using Kijk.Application.Imports.Categorize;
using Kijk.Application.Imports.Cleanup;
using Kijk.Application.Imports.Commit;
using Kijk.Application.Imports.ConfirmMapping;
using Kijk.Application.Imports.Create;
using Kijk.Application.Imports.Detection;
using Kijk.Application.Imports.Get;
using Kijk.Application.Imports.Processing;
using Kijk.Application.Imports.Review;
using Kijk.Application.Imports.Settings;
using Kijk.Application.Imports.Shared;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Imports;

/// <summary>Registers the handlers and services owned by the Imports feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<ImportAiPreviewHandler>();
        services.AddScoped<CancelImportHandler>();
        services.AddScoped<CategorizeImportHandler>();
        services.AddScoped<CleanupImportsHandler>();
        services.AddScoped<CommitImportHandler>();
        services.AddScoped<ConfirmImportMappingHandler>();
        services.AddScoped<CreateImportHandler>();
        services.AddScoped<GetImportsHandler>();
        services.AddScoped<ImportCategorizationProcessor>();
        services.AddScoped<ImportJobProcessor>();
        services.AddScoped<UpdateImportCandidateHandler>();
        services.AddScoped<ImportSettingsHandler>();
        services.AddScoped<ImportFileReader>();
        services.AddScoped<ICsvFormatDetector, AiCsvFormatDetector>();
        services.AddScoped<ITransactionCategorizer, AiTransactionCategorizer>();

        return services;
    }
}