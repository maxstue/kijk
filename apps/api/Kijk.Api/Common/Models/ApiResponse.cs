namespace Kijk.Api.Common.Models;

public record ApiResponse<T>
{
    public T? Data { get; init; }

    public ResponseStatus Status { get; set; }

    public string? Message { get; set; }

    public static implicit operator ApiResponse<T>(T data) => Success(data);

    public static ApiResponse<T> Success(T data, string? message = default)
    {
        return new ApiResponse<T> { Status = ResponseStatus.Success, Data = data, Message = message };
    }

    public static ApiResponse<List<AppError>> Error(string errorMessage)
    {
        return new ApiResponse<List<AppError>> { Status = ResponseStatus.Error, Message = errorMessage, Data = new List<AppError>() };
    }

    public static ApiResponse<List<AppError>> Error(List<AppError> error, string? errorMessage = default)
    {
        return new ApiResponse<List<AppError>> { Status = ResponseStatus.Error, Message = errorMessage, Data = error };
    }

    public static ApiResponse<List<AppError>> Error(AppError appError, string? errorMessage = default)
    {
        return new ApiResponse<List<AppError>> { Status = ResponseStatus.Error, Message = errorMessage, Data = new List<AppError> { appError } };
    }
}