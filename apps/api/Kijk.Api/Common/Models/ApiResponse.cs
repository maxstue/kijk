namespace Kijk.Api.Common.Models;

public record ApiResponse<T>
{
    public T? Data { get; private init; }

    public ResponseStatus Status { get; set; }

    public string? Message { get; set; }

    public static implicit operator ApiResponse<T>(T data)
    {
        return Success(data);
    }

    public static ApiResponse<T> Success(T data, string? message = default)
    {
        return new ApiResponse<T> { Status = ResponseStatus.Success, Data = data, Message = message };
    }

    public static ApiResponse<List<Error>> Error(string errorMessage)
    {
        return new ApiResponse<List<Error>> { Status = ResponseStatus.Error, Message = errorMessage, Data = new List<Error>() };
    }

    public static ApiResponse<List<Error>> Error(List<Error> error, string? errorMessage = default)
    {
        return new ApiResponse<List<Error>> { Status = ResponseStatus.Error, Message = errorMessage, Data = error };
    }

    public static ApiResponse<List<Error>> Error(Error error, string? errorMessage = default)
    {
        return new ApiResponse<List<Error>> { Status = ResponseStatus.Error, Message = errorMessage, Data = new List<Error> { error } };
    }
}
