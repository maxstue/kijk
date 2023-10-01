using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

using ILogger = Serilog.ILogger;

namespace Kijk.Api.Application.Weathers;

public class WeatherService : IWeatherService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger _logger = Log.ForContext<WeatherService>();

    public WeatherService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<Weather>> Create(WeatherDTO weatherDto, CancellationToken cancellationToken = default)
    {
        try
        {
            var newWeather = new Weather { Name = weatherDto.Name };
            var resEntityEntry =
                await _dbContext.Weathers.AddAsync(newWeather, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return resEntityEntry.Entity;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return WeatherErrors.Failure(e.Message);
        }
    }

    public async Task<Result<Weather>> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _dbContext.Weathers.FindAsync(id, cancellationToken);

            if (entity is null)
            {
                return WeatherErrors.NotFound();
            }

            return entity;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return WeatherErrors.Failure(e.Message);
        }
    }

    public async Task<Result<List<Weather>>> GetAll(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Weathers.ToListAsync(cancellationToken);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return WeatherErrors.Failure(e.Message);
        }
    }

    public async Task<Result<Weather>> Update(
        Guid id,
        WeatherDTO weatherDto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await _dbContext.Weathers.FindAsync(id);

            if (foundEntity == null)
            {
                _logger.Warning("Weather could not be found");
                return WeatherErrors.NotFound();
            }

            foundEntity.Name = weatherDto.Name;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return foundEntity;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return WeatherErrors.Failure();
        }
    }

    public async Task<Result<bool>> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var foundEntity = await _dbContext.Weathers.FindAsync(id);

            if (foundEntity == null)
            {
                _logger.Warning("Weather could not be found");
                return WeatherErrors.NotFound();
            }

            _dbContext.Weathers.Remove(foundEntity);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return WeatherErrors.Failure();
        }
    }
}
