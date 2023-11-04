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
    public async Task<AppResult<List<CategoryDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == _currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return AppError.NotFound(description: $"User with id '{_currentUser.Id}' was not found");
            }

            return user.Categories.Select(x => x.MapToDto()).ToList();
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <inheritdoc cref="ICategoriesService.CreateAsync"/>
    public async Task<AppResult<CategoryDto>> CreateAsync(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken = default)
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
                return AppError.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' was not found");
            }

            if (user.Categories.Any(c => string.Equals(c.Name, createCategoryRequest.Name, StringComparison.CurrentCultureIgnoreCase)))
            {
                return AppError.Validation($"A category with the name '{createCategoryRequest.Name}' already exists");
            }

            var newCategory = Category.Create(createCategoryRequest.Name, createCategoryRequest.Color, CategoryType.User, user);
            var resEntity = await _dbContext.AddAsync(newCategory, cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return resEntity.Entity.MapToDto();
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <inheritdoc cref="ICategoriesService.UpdateAsync"/>
    public async Task<AppResult<CategoryDto>> UpdateAsync(
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
                return AppError.NotFound(description: $"User with id '{_currentUser.Id}' was not found");
            }

            var category = await _dbContext.Categories.FindAsync(new object?[] { id }, cancellationToken);

            if (category is null)
            {
                return AppError.NotFound($"Category with id {id} was not found");
            }

            category.Name = updateCategoryRequest.Name ?? category.Name;
            category.Color = updateCategoryRequest.Color ?? category.Color;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return category.MapToDto();
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <inheritdoc cref="ICategoriesService.DeleteAsync"/>
    public async Task<AppResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
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
                return AppError.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' was not found");
            }

            if (user.Categories.Find(x => x.Id != id) is null)
            {
                _logger.Warning("User with id '{UserId}' was not allowed to delete the category with id {CategoryId}", _currentUser.Id, id);
                return AppError.NotFound(description: $"‘User‘ with id '{_currentUser.Id}' is not allowed to delete the category");
            }

            var foundEntity = await _dbContext.Categories.FindAsync(new object[] { id }, cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Category with id {Id} could not be found", id);
                return AppError.NotFound($"Category with id '{id}' could not be found");
            }

            _dbContext.Categories.Remove(foundEntity);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }
}
