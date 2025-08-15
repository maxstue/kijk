using Kijk.Shared;
using Kijk.Shared.Extensions;

namespace Kijk.Api.Filters;

public class ValidationFilter<T>(IValidator<T> validator) : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var objectToValidate = context.Arguments.OfType<T>().First();
        var validationResult = await validator.ValidateAsync(objectToValidate);
        if (!validationResult.IsValid)
        {
            var problemDetails = validationResult.Errors
                .Select(x => Error.Validation(description: $"{x.ErrorCode} - {x.ErrorMessage}"))
                .FirstOrDefault()
                .ToProblemDetails();
            return TypedResults.Problem(problemDetails);
        }

        return await next.Invoke(context);
    }
}