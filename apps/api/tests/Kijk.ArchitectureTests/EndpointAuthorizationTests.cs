using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Application;
using Kijk.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace Kijk.ArchitectureTests;

public class EndpointAuthorizationTests
{
    [Test]
    public async Task EveryAuthenticatedEndpointDeclaresItsSpaceAuthorization()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddApplication();
        await using var app = builder.Build();
        app.MapEndpoints();

        var endpoints = ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(dataSource => dataSource.Endpoints)
            .OfType<RouteEndpoint>()
            .ToList();

        var undeclared = endpoints
            .Where(endpoint => endpoint.Metadata.GetMetadata<IAllowAnonymous>() is null
                && endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>().Count > 0)
            .Where(endpoint => !endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>()
                    .Any(data => AppConstants.Policies.IsSpacePermission(data.Policy))
                && endpoint.Metadata.GetMetadata<RouteSpacePermissionMetadata>() is null
                && endpoint.Metadata.GetMetadata<NoSpacePermissionMetadata>() is null)
            .Select(endpoint => $"{string.Join(',', endpoint.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? [])} {endpoint.RoutePattern.RawText}")
            .ToList();

        await Assert.That(endpoints).IsNotEmpty();
        await Assert.That(undeclared).IsEmpty();
    }
}