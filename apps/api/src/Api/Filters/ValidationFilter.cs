namespace Kijk.Api.Filters;

/// <summary>
/// A filter for validating the request body with a validator.
/// </summary>
/// <param name="validator"></param>
/// <typeparam name="T">The type to validate.</typeparam>
public class ValidationFilter<T>(IValidator<T> validator) : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var objectToValidate = context.Arguments.OfType<T>().First();
        var validationResult = await validator.ValidateAsync(objectToValidate);

        if (validationResult.IsValid)
        {
            return await next.Invoke(context);
        }

        var problemDetails = validationResult.Errors
            .ToDictionary(x => x.PropertyName, x => new[] { $"{x.ErrorCode}: {x.ErrorMessage} " });

        return TypedResults.ValidationProblem(problemDetails);
    }
}