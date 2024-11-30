namespace Kijk.Api.Common.Models;

public record ApiResponse<T>
{
    public T? Data { get; init; }

    public ResponseStatus Status { get; set; }

    public string? Message { get; set; }

    public static implicit operator ApiResponse<T>(T data) => Success(data);

    public static ApiResponse<T> Success(T data, string? message = default) =>
        new() { Status = ResponseStatus.Success, Data = data, Message = message };

    public static ApiResponse<List<AppError>> Error(string errorMessage) =>
        new() { Status = ResponseStatus.Error, Message = errorMessage, Data = [] };

    public static ApiResponse<List<AppError>> Error(List<AppError> error, string? errorMessage = default) =>
        new() { Status = ResponseStatus.Error, Message = errorMessage, Data = error };

    public static ApiResponse<List<AppError>> Error(AppError appError, string? errorMessage = default) => new()
    {
        Status = ResponseStatus.Error,
        Message = errorMessage,
        Data = [appError]
    };
}