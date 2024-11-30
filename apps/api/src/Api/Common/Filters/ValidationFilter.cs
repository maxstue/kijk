using Kijk.Api.Common.Models;

namespace Kijk.Api.Common.Filters;

public class ValidationFilter<T>(IValidator<T> validator) : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var objectToValidate = context.Arguments.OfType<T>().First();

        var validationResult = await validator.ValidateAsync(objectToValidate);

        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(x => AppError.Validation(description: $"{x.ErrorCode} - {x.ErrorMessage}"))
                .ToList();
            return TypedResults.BadRequest(ApiResponseBuilder.Error(errors));
        }

        return await next.Invoke(context);
    }
}