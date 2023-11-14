using Kijk.Api.Application.Users;

namespace Kijk.Api.Endpoints;

public static class UsersEndpoint
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/users");

        group.MapGet("/sign-in", SignInAsync);
        group.MapPut("/init", InitAsync);
        group.MapPut("/", UpdateAsync);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> SignInAsync(IUsersService service)
    {
        var result = await service.SignInAsync();
        return result.ToResponse("Successfully signed in");
    }

    private static async Task<IResult> InitAsync(IUsersService service, UserInitRequest userInitRequest)
    {
        var result = await service.InitAsync(userInitRequest);
        return result.ToResponse("Successfully initialized");
    }

    private static async Task<IResult> UpdateAsync(IUsersService service, UserUpdateRequest userUpdateRequest)
    {
        var result = await service.UpdateAsync(userUpdateRequest);
        return result.ToResponse("Successfully updated");
    }
}
