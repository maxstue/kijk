namespace Kijk.Shared.Extensions;

/// <summary>
/// Extension methods for <see cref="Result{TValue}" />.
/// </summary>
public static class ResultExtensions
{
    public static TResult Match<TValue, TResult>(this Result<TValue> result, Func<TValue, TResult> onSuccess, Func<Error, TResult> onFailure) =>
        result.IsSuccess ? onSuccess(result.Value) : onFailure(result.Error);

    public static async Task<TResult> MatchAsync<TResult, TValue>(this Result<TValue> result, Func<TValue, Task<TResult>> onSuccess,
        Func<Error, Task<TResult>> onError) => result.IsSuccess ? await onSuccess(result.Value) : await onError(result.Error);
}