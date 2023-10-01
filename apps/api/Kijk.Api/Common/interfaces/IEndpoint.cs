namespace Kijk.Api.Common.interfaces;

/// <summary>
///     Use this to indicate the class as an endpoint and make it detectable for automatic registration.
/// </summary>
public interface IEndpoint
{
    IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints);
}
