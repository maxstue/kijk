namespace Kijk.Api.Application.Weathers;

public class WeatherValidator : AbstractValidator<WeatherDTO>
{
    public WeatherValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(WeatherErrors.Codes.WeatherPostValidationError)
            .Length(1, 10).WithErrorCode(WeatherErrors.Codes.WeatherPostValidationError);
    }
}
