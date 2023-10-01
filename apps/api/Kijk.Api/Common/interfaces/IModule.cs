namespace Kijk.Api.Common.interfaces;

/// <summary>
///     Used to indicate modules and make it detectable for automatic registration.
/// </summary>
public interface IModule
{
    IServiceCollection RegisterModule(IServiceCollection builder);
}
