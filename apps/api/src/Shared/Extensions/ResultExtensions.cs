namespace Kijk.Shared.Extensions;

/// <summary>
/// Extension methods for <see cref="Result{TValue}" />.
/// </summary>
public static class ResultExtensions
{
    /// <summary>Maps a result to a single value by handling both the success and the error case.</summary>
    /// <param name="result">The result.</param>
    /// <param name="onSuccess">Called with the value on success.</param>
    /// <param name="onFailure">Called with the error on failure.</param>
    /// <returns>The value returned by the called handler.</returns>
    public static TResult Match<TValue, TResult>(this Result<TValue> result, Func<TValue, TResult> onSuccess, Func<Error, TResult> onFailure) =>
        result.IsSuccess ? onSuccess(result.Value) : onFailure(result.Error);

    /// <summary>Asynchronously maps a result by handling both the success and the error case.</summary>
    /// <param name="result">The result.</param>
    /// <param name="onSuccess">Called with the value on success.</param>
    /// <param name="onError">Called with the error on failure.</param>
    /// <returns>The value returned by the called handler.</returns>
    public static async Task<TResult> MatchAsync<TResult, TValue>(this Result<TValue> result, Func<TValue, Task<TResult>> onSuccess,
        Func<Error, Task<TResult>> onError) => result.IsSuccess ? await onSuccess(result.Value) : await onError(result.Error);
}