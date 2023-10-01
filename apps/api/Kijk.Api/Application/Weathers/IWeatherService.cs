using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Weathers;

public interface IWeatherService
{
    Task<Result<Weather>> Create(WeatherDTO weatherDto, CancellationToken cancellationToken = default);

    Task<Result<Weather>> GetById(Guid id, CancellationToken cancellationToken = default);

    Task<Result<List<Weather>>> GetAll(CancellationToken cancellationToken = default);

    Task<Result<Weather>> Update(Guid id, WeatherDTO weatherDto, CancellationToken cancellationToken = default);

    Task<Result<bool>> Delete(Guid id, CancellationToken cancellationToken = default);
}
