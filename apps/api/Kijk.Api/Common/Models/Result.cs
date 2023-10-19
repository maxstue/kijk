using Kijk.Api.Common.Utils;

namespace Kijk.Api.Common.Models;

/// <summary>
///     A discriminated union of value or a, error.
/// </summary>
public readonly record struct Result<TValue>
{

    private static readonly Error NoFirstError = Error.Unexpected(
        "ErrorOr.NoFirstError",
        "First error cannot be retrieved from a successful Result.");

    private readonly List<Error>? _errors = null;
    private readonly TValue? _value = default;

    /// <summary>
    ///     Gets a value indicating whether the state is success.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    ///     Gets a value indicating whether the state is error.
    /// </summary>
    public bool IsError => !IsSuccess;

    /// <summary>
    ///     Gets the list of errors. If the state is not error, the list will be empty.
    /// </summary>
    public List<Error> Errors => IsError ? _errors! : new List<Error>();

    /// <summary>
    ///     Gets the value.
    /// </summary>
    public TValue Value => _value!;

    /// <summary>
    ///     Gets the first error.
    /// </summary>
    public Error FirstError => !IsError ? NoFirstError : _errors!.First();

    private Result(List<Error> errors)
    {
        _errors = errors;
        IsSuccess = false;
    }

    private Result(TValue value)
    {
        _value = value;
        IsSuccess = true;
    }

    /// <summary>
    ///     Creates an <see cref="Result{TValue}" /> from a a value.
    /// </summary>
    public static Result<TValue> ToResult(TValue value) => value;

    /// <summary>
    ///     Creates an <see cref="Result{TValue}" /> from a value.
    /// </summary>
    public static implicit operator Result<TValue>(TValue value) => new(value);

    public static implicit operator Result<TValue>(Tuple<TValue, string> tuple) => new(tuple.Item1);

    /// <summary>
    ///     Creates an <see cref="Result{TValue}" /> from a list of errors.
    /// </summary>
    public static Result<TValue> From(List<Error> errors) => errors;

    /// <summary>
    ///     Creates an <see cref="Result{TValue}" /> from an error.
    /// </summary>
    public static implicit operator Result<TValue>(Error error) => new(new List<Error> { error });

    /// <summary>
    ///     Creates an <see cref="Result{TValue}" /> from a list of errors.
    /// </summary>
    public static implicit operator Result<TValue>(List<Error> errors) => new(errors);

    public TResult Match<TResult>(Func<TValue, TResult> onValue, Func<List<Error>, TResult> onError)
    {
        return IsError ? onError(Errors) : onValue(Value);
    }

    public async Task<TResult> MatchAsync<TResult>(Func<TValue, Task<TResult>> onValue, Func<List<Error>, Task<TResult>> onError)
    {
        return IsError ? await onError(Errors) : await onValue(Value);
    }

    public IResult ToResponse(string? successMessage = default, SuccessType successType = SuccessType.Ok)
    {
        return this.Match(
            obj =>
            {
                var response = ApiResponse<TValue>.Success(obj, successMessage);
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
