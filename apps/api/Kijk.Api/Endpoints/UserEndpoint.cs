using Kijk.Api.Application.Users;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

public static class UserEndpoint
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/user");

        group.MapPost("/init", Init);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> Init(IUserService service, [FromBody] AuthUser authUser)
    {
        var result = await service.Init(authUser);
        return result.ToResponse("Successfully initialized");
    }
}
