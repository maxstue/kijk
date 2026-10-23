using Kijk.Api.Extensions;
using Kijk.Application.Shared.Features;
using Kijk.Shared;

namespace Kijk.Api.Filters;

/// <summary>
/// Answers with not found while a feature is switched off for the current user, so a switched-off part of Kijk is
/// unavailable in the API and not just hidden in the client. It runs after authentication and authorization.
/// </summary>
/// <param name="feature">The key of the feature, see <see cref="AppConstants.Features" />.</param>
public sealed class FeatureFilter(string feature) : IEndpointFilter
{
    /// <inheritdoc />
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var services = context.HttpContext.RequestServices;
        var currentUser = services.GetRequiredService<CurrentUser>();
        if (currentUser.User is not null
            && !await services.GetRequiredService<IFeatureFlags>().IsEnabledAsync(feature, context.HttpContext.RequestAborted))
        {
            return TypedResults.Problem(Error.Custom(ErrorType.NotFound, ErrorCodes.FeatureDisabled, "This part of Kijk is not available.").ToProblemDetails());
        }

        return await next(context);
    }
}