using Kijk.Application.Imports.Categorization;
using Kijk.Application.Imports.Categorize;
using Kijk.Application.Imports.Detection;
using Kijk.Application.Imports.Settings;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Imports;

/// <summary>
/// Registers import services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<UpdateImportSettingsRequest>, UpdateImportSettingsValidator>();
        services.AddScoped<IValidator<CategorizeImportRequest>, CategorizeImportValidator>();
        services.AddScoped<ICsvFormatDetector, AiCsvFormatDetector>();
        services.AddScoped<ITransactionCategorizer, AiTransactionCategorizer>();
        return services;
    }
}