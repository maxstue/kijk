namespace Kijk.Api.Filters;

/// <summary>
/// A filter for validating the request body with a validator.
/// </summary>
/// <param name="validator">The validator for the request type.</param>
/// <typeparam name="T">The type to validate.</typeparam>
public class ValidationFilter<T>(IValidator<T> validator) : IEndpointFilter where T : class
{
    /// <inheritdoc />
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var objectToValidate = context.Arguments.OfType<T>().FirstOrDefault()
                               ?? throw new InvalidOperationException(
                                   $"Validation filter could not find a request argument of type '{typeof(T).Name}'.");

        var validationResult = await validator.ValidateAsync(objectToValidate, context.HttpContext.RequestAborted);

        if (validationResult.IsValid)
        {
            return await next.Invoke(context);
        }

        // Several rules can fail for the same property, so the errors are grouped instead of keyed by property.
        var problemDetails = validationResult.Errors
            .GroupBy(x => x.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(x => $"{x.ErrorCode}: {x.ErrorMessage}").ToArray());

        return TypedResults.ValidationProblem(problemDetails);
    }
}