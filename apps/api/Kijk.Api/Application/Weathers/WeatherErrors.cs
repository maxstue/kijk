using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Weathers;

public static class WeatherErrors
{

    public static Error NotFound()
    {
        return Error.NotFound(
            Codes.NotFoundError,
            "Weather not found");
    }

    public static Error Failure(string message = "")
    {
        return Error.Failure(
            Codes.WeatherDefaultError,
            $"Weatherservice failure,  {message}");
    }

    public static class Codes
    {
        public const string WeatherDefaultError = "W0001";
        internal const string WeatherPostValidationError = "WPV0001";
        public const string NotFoundError = "WNF0001";
    }
}
