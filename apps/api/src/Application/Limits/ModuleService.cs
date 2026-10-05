using Kijk.Application.Limits.Create;
using Kijk.Application.Limits.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Limits;

/// <summary>
/// Registers consumption limit services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateLimitRequest>, CreateLimitValidator>();
        services.AddScoped<IValidator<UpdateLimitRequest>, UpdateLimitValidator>();
        return services;
    }
}