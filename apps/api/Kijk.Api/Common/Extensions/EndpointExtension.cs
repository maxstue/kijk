using Kijk.Api.Common.Models;
using Kijk.Api.Common.Utils;

namespace Kijk.Api.Common.Extensions;

public static class EndpointExtension
{
    public static IResult ToResponse<TResult>(this Result<TResult> result, string? successMessage = default, SuccessType successType = SuccessType.Ok)
    {
        return result.Match<IResult>(
            obj =>
            {
                var response = ApiResponse<TResult>.Success(obj, successMessage);
                var statusCode = ResponseUtils.ToStatusCode(successType);
                return ResponseUtils.CreateTypedResult(response, statusCode);
            },
            errors =>
            {
                var firstError = errors.First();
                var response = ApiResponse<Error>.Error(errors);
                var statusCode = ResponseUtils.ToStatusCode(firstError.Type);
                return ResponseUtils.CreateTypedResult(response, statusCode);
            });
    }
}
