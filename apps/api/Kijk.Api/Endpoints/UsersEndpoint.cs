using Kijk.Api.Application.Users;

namespace Kijk.Api.Endpoints;

public static class UsersEndpoint
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/users");

        group.MapGet("/init", Init);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> Init(IUsersService service)
    {
        var result = await service.InitAsync();
        return result.ToResponse("Successfully initialized");
    }
}
