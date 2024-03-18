using Kijk.Api.Application.Users;

namespace Kijk.Api.Endpoints;

public static class UsersEndpoint
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/users")
            .WithGroupName("Users")
            .WithTags("Users")
            .WithOpenApi();

        group.MapGet("/sign-in", SignInAsync);
        group.MapGet("/me", MeAsync);

        group.MapPut("/welcome", WelcomeAsync);
        group.MapPut("/", UpdateAsync);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> SignInAsync(UsersService service, CancellationToken cancellationToken)
    {
        var result = await service.SignInAsync(cancellationToken);
        return result.ToResponse("Successfully signed in");
    }

    private static async Task<IResult> MeAsync(UsersService service, CancellationToken cancellationToken)
    {
        var result = await service.MeAsync(cancellationToken);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> WelcomeAsync(UsersService service, UserInitRequest userInitRequest, CancellationToken cancellationToken)
    {
        var result = await service.WelcomeAsync(userInitRequest, cancellationToken);
        return result.ToResponse("Successfully initialized");
    }

    private static async Task<IResult> UpdateAsync(UsersService service, UserUpdateRequest userUpdateRequest, CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(userUpdateRequest, cancellationToken);
        return result.ToResponse("Successfully updated");
    }
}
