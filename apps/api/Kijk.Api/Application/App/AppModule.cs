using Kijk.Api.Common.interfaces;

namespace Kijk.Api.Application.App;

public class AppModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services)
    {
        return services;
    }
}
