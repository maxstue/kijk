namespace Kijk.Api.Common.Models;

/// <summary>
/// Helps to build objects of type <see cref="ApiResponse{T}" />.
/// </summary>
public static class ApiResponseBuilder
{
    public static ApiResponse<T> Success<T>(T data, string? message = default) =>
        new() { Status = ResponseStatus.Success, Data = data, Message = message };

    public static ApiResponse<List<AppError>> Error(string message) => ApiResponse<List<AppError>>.Error(message);

    public static ApiResponse<List<AppError>> Error(AppError error) => ApiResponse<List<AppError>>.Error(error);
    public static ApiResponse<List<AppError>> Error(List<AppError> errors) => ApiResponse<List<AppError>>.Error(errors);
}
