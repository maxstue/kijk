﻿using Kijk.Api.Common.Utils;

namespace Kijk.Api.Common.Models;

/// <summary>
///     A discriminated union of value or a, error.
/// </summary>
public readonly record struct AppResult<TValue>
{
    private static readonly AppError NoFirstAppError = AppError.Unexpected(
        "ErrorOr.NoFirstError",
        "First error cannot be retrieved from a successful Result.");

    private readonly List<AppError>? _errors = null;
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
    public List<AppError> Errors => IsError ? _errors! : new List<AppError>();

    /// <summary>
    ///     Gets the value.
    /// </summary>
    public TValue Value => _value!;

    /// <summary>
    ///     Gets the first error.
    /// </summary>
    public AppError FirstAppError => !IsError ? NoFirstAppError : _errors!.First();

    private AppResult(List<AppError> errors)
    {
        _errors = errors;
        IsSuccess = false;
    }

    private AppResult(TValue value)
    {
        _value = value;
        IsSuccess = true;
    }

    /// <summary>
    ///     Creates an <see cref="AppResult{TValue}" /> from a value.
    /// </summary>
    public static implicit operator AppResult<TValue>(TValue value) => new(value);

    public static implicit operator AppResult<TValue>(Tuple<TValue, string> tuple) => new(tuple.Item1);

    /// <summary>
    ///     Creates an <see cref="AppResult{TValue}" /> from a list of errors.
    /// </summary>
    public static AppResult<TValue> From(List<AppError> errors) => errors;

    /// <summary>
    ///     Creates an <see cref="AppResult{TValue}" /> from an error.
    /// </summary>
    public static implicit operator AppResult<TValue>(AppError appError) => new(new List<AppError> { appError });

    /// <summary>
    ///     Creates an <see cref="AppResult{TValue}" /> from a list of errors.
    /// </summary>
    public static implicit operator AppResult<TValue>(List<AppError> errors) => new(errors);

    public TResult Match<TResult>(Func<TValue, TResult> onValue, Func<List<AppError>, TResult> onError)
    {
        return IsError ? onError(Errors) : onValue(Value);
    }

    public async Task<TResult> MatchAsync<TResult>(Func<TValue, Task<TResult>> onValue, Func<List<AppError>, Task<TResult>> onError)
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
                var response = ApiResponse<AppError>.Error(errors);
                var statusCode = ResponseUtils.ToStatusCode(firstError.Type);
                return ResponseUtils.CreateTypedResult(response, statusCode);
            });
    }
}
