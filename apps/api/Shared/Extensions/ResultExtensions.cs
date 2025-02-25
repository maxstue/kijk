using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Shared.Extensions;

/// <summary>
/// Extension methods for <see cref="Result{TValue}" />.
/// </summary>
public static class ResultExtensions
{
    public static TResult Match<TResult, TValue>(this Result<TValue> result, Func<TValue, TResult> onSuccess, Func<Error, TResult> onFailure) =>
        result.IsSuccess ? onSuccess(result.Value) : onFailure(result.Error);

    public static async Task<TResult> MatchAsync<TResult, TValue>(this Result<TValue> result, Func<TValue, Task<TResult>> onSuccess,
        Func<Error, Task<TResult>> onError) => result.IsSuccess ? await onSuccess(result.Value) : await onError(result.Error);

    /// <summary>
    /// Converts a <see cref="Result{TValue}" /> to a <see cref="IResult" />.
    /// </summary>
    /// <param name="result"></param>
    /// <typeparam name="TValue"></typeparam>
    /// <returns></returns>
    /// <exception cref="InvalidCastException"></exception>
    public static IResult ToProblemResult<TValue>(this Result<TValue> result) =>
        result.IsSuccess ? throw new InvalidCastException() : Results.Problem(result.Error.ToProblemDetails());

    /// <summary>
    /// Converts a <see cref="Result{TValue}" /> to a <see cref="ProblemDetails" />.
    /// </summary>
    /// <param name="result"></param>
    /// <typeparam name="TValue"></typeparam>
    /// <returns></returns>
    /// <exception cref="InvalidCastException"></exception>
    public static ProblemDetails ToProblemDetails<TValue>(this Result<TValue> result) => result.Error.ToProblemDetails();
}