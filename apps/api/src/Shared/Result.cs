using System.Diagnostics.CodeAnalysis;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;

namespace Kijk.Shared;

/// <summary>
/// A discriminated union of value or a, error.
/// </summary>
public readonly record struct Result<TValue>
{
    /// <summary>
    /// Gets a value indicating whether the state is success.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    /// Gets a value indicating whether the state is error.
    /// </summary>
    public bool IsError => !IsSuccess;

    /// <summary>
    /// Gets the list of errors. If the state is not error, the list will be empty.
    /// </summary>
    public Error Error { get; } = default!;

    /// <summary>
    /// Gets the value.
    /// </summary>
    [field: AllowNull, MaybeNull]
    public TValue Value
    {
        get => IsError ? throw new InvalidOperationException("The result is in an error state.") : field!;
        private init;
    }

    public Result(Error error)
    {
        Error = error;
        IsSuccess = false;
    }

    public Result(TValue value)
    {
        Value = value;
        IsSuccess = true;
    }

    /// <summary>
    /// Creates an <see cref="Result{TValue}" /> from a value.
    /// </summary>
    public static implicit operator Result<TValue>(TValue value) => new(value);

    public static implicit operator Result<TValue>(Tuple<TValue, string> tuple) => new(tuple.Item1);

    /// <summary>
    /// Creates an <see cref="Result{TValue}" /> from an error.
    /// </summary>
    public static implicit operator Result<TValue>(Error appError) => new(appError);
}