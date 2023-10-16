using Kijk.Api.Application.Users;
using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

public static class UsersEndpoint
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/users");

        group.MapPost("/init", Init);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> Init(IUsersService service, [FromBody] AuthUser authUser)
    {
        var result = await service.InitAsync(authUser);
        return result.ToResponse("Successfully initialized");
    }
}
