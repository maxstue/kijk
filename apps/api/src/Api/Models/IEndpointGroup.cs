namespace Kijk.Api.Models;

/// <summary>
/// Interface for endpoint groups.
/// All endpoints an the given group will be automatically registered on startup.
/// </summary>
public interface IEndpointGroup
{
    /// <summary>
    /// Maps the endpoints to the endpoint route builder.
    /// </summary>
    /// <param name="builder">The route builder to map the endpoints on.</param>
    /// <returns>The route builder.</returns>
    IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder);
}