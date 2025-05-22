using Microsoft.AspNetCore.Routing;

namespace Kijk.Shared;

/// <summary>
/// Interface for endpoint groups.
/// All endpoints an the given group will be automatically registered on startup.
/// </summary>
public interface IEndpointGroup
{
    /// <summary>
    /// Maps the endpoints to the endpoint route builder.
    /// </summary>
    /// <param name="builder"></param>
    /// <returns></returns>
    IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder);
}