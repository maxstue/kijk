using Kijk.Api.Common.Models;
using Kijk.Api.Common.Utils;

namespace Kijk.Api.Common.Filters;

public class ValidationFilter<T> : IEndpointFilter where T : class
{
    private readonly IValidator<T> _validator;

    public ValidationFilter(IValidator<T> validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var objectToValidate = context.Arguments.SingleOrDefault(x => x?.GetType() == typeof(T)) as T;
        if (objectToValidate is null)
        {
            var error = Error.Failure(ErrorCodes.ValidationError, $"Das Objekt vom Type '{typeof(T).Name}' darf nicht 'null' sein");
            var response = ApiResponse<IResult>.Error(error);
            var statusCode = ResponseUtils.ToStatusCode(error.Type);
            return ResponseUtils.CreateTypedResult(response, statusCode);
        }

        var validationResult = await _validator.ValidateAsync(objectToValidate);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(x => Error.Validation(ErrorCodes.ValidationError, $"{x.ErrorCode} - {x.ErrorMessage}"))
                .ToList();
            var response = ApiResponse<IResult>.Error(errors);
            var statusCode = ResponseUtils.ToStatusCode(errors[0].Type);
            return ResponseUtils.CreateTypedResult(response, statusCode);
        }

        return await next.Invoke(context);
    }
}
