using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Application.Categories;

/// <inheritdoc cref="ICategoriesService"/>
public class CategoriesService : ICategoriesService
{
    private readonly ILogger _logger = Log.ForContext<CategoriesService>();
    private readonly CurrentUser _currentUser;
    private readonly AppDbContext _dbContext;

    public CategoriesService(CurrentUser currentUser, AppDbContext dbContext)
    {
        _currentUser = currentUser;
        _dbContext = dbContext;
    }

    /// <inheritdoc cref="ICategoriesService.GetAllAsync"/>
    public async Task<Result<List<CategoryDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == _currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Error.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' was not found");
            }

            return user.Categories.Select(x => x.MapToDto()).ToList();
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return CategoriesErrors.Failure();
        }
    }

    /// <inheritdoc cref="ICategoriesService.CreateAsync"/>
    public async Task<Result<CategoryDto>> CreateAsync(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == _currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                _logger.Warning("User with id {Id} could not be found", _currentUser.Id);
                return Error.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' was not found");
            }

            if (user.Categories.Any(c => string.Equals(c.Name, createCategoryRequest.Name, StringComparison.CurrentCultureIgnoreCase)))
            {
                return CategoriesErrors.Failure($"A category with the name '{createCategoryRequest.Name}' already exists");
            }

            var newCategory = new Category
            {
                Id = Guid.NewGuid(), Name = createCategoryRequest.Name, Color = createCategoryRequest.Color, Users = new List<User> { user }
            };
            var resEntity = await _dbContext.AddAsync(newCategory, cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return resEntity.Entity.MapToDto();
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return CategoriesErrors.Failure();
        }
    }

    /// <inheritdoc cref="ICategoriesService.UpdateAsync"/>
    public async Task<Result<CategoryDto>> UpdateAsync(
        Guid id,
        UpdateCategoryRequest updateCategoryRequest,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == _currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                _logger.Warning("User with id {Id} could not be found", _currentUser.Id);
                return Error.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' was not found");
            }

            var category = await _dbContext.Categories.FindAsync(new object?[] { id }, cancellationToken);

            if (category is null)
            {
                return CategoriesErrors.NotFound();
            }

            category.Name = updateCategoryRequest.Name ?? category.Name;
            category.Color = updateCategoryRequest.Color ?? category.Color;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return category.MapToDto();
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return CategoriesErrors.Failure();
        }
    }

    /// <inheritdoc cref="ICategoriesService.DeleteAsync"/>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == _currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                _logger.Warning("User with id {Id} could not be found", _currentUser.Id);
                return Error.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' was not found");
            }

            if (user.Categories.Any(x => x.Id != id))
            {
                _logger.Warning("User with id {UserId} was not allowed to delete the category with id {CategoryId}", _currentUser.Id, id);
                return Error.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' is not allowed to delete the category");
            }
            
            var foundEntity = await _dbContext.Categories.FindAsync(new object[] { id }, cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Category with id {Id} could not be found", id);
                return CategoriesErrors.NotFound();
            }

            _dbContext.Categories.Remove(foundEntity);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return CategoriesErrors.Failure();
        }
    }
}
