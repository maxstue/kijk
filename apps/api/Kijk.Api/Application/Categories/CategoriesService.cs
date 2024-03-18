using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Application.Categories;

/// <summary>
/// Handles all logic related to <see cref="Category"/>
/// </summary>
public class CategoriesService(CurrentUser currentUser, AppDbContext dbContext)
{
    private readonly ILogger _logger = Log.ForContext<CategoriesService>();

    /// <summary>
    ///     Retrieves all categories for the current user.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<AppResult<List<CategoryDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return AppError.NotFound(description: $"User with id '{currentUser.Id}' was not found");
            }

            return user.Categories.Select(CategoryDto.Create).ToList();
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <summary>
    ///     Retrieves a single category by its id.
    /// </summary>
    /// <param name="createCategoryRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<AppResult<CategoryDto>> CreateAsync(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                _logger.Warning("User with id {Id} could not be found", currentUser.Id);
                return AppError.NotFound(description: $"‘User‘ with id '{currentUser.Id}' was not found");
            }

            if (user.Categories.Any(c => string.Equals(c.Name, createCategoryRequest.Name, StringComparison.CurrentCultureIgnoreCase)))
            {
                return AppError.Validation($"A category with the name '{createCategoryRequest.Name}' already exists");
            }

            var newCategory = Category.Create(createCategoryRequest.Name, createCategoryRequest.Color, CategoryType.User, user);
            var resEntity = await dbContext.AddAsync(newCategory, cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);

            return CategoryDto.Create(resEntity.Entity);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <summary>
    ///     Updates a category by its id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updateCategoryRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<AppResult<CategoryDto>> UpdateAsync(
        Guid id,
        UpdateCategoryRequest updateCategoryRequest,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                _logger.Warning("User with id {Id} could not be found", currentUser.Id);
                return AppError.NotFound(description: $"User with id '{currentUser.Id}' was not found");
            }

            var category = await dbContext.Categories.FindAsync(new object?[] { id }, cancellationToken);

            if (category is null)
            {
                return AppError.NotFound($"Category with id {id} was not found");
            }

            category.Name = updateCategoryRequest.Name ?? category.Name;
            category.Color = updateCategoryRequest.Color ?? category.Color;

            await dbContext.SaveChangesAsync(cancellationToken);

            return CategoryDto.Create(category);
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }

    /// <summary>
    ///     Deletes a category by its id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<AppResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                _logger.Warning("User with id {Id} could not be found", currentUser.Id);
                return AppError.NotFound(description: $"‘User‘ with id '{currentUser.Id}' was not found");
            }

            if (user.Categories.Find(x => x.Id == id) is null)
            {
                _logger.Warning("User with id '{UserId}' was not allowed to delete the category with id {CategoryId}", currentUser.Id, id);
                return AppError.NotFound(description: $"‘User‘ with id '{currentUser.Id}' is not allowed to delete the category");
            }

            var foundEntity = await dbContext.Categories.FindAsync(new object[] { id }, cancellationToken);

            if (foundEntity == null)
            {
                _logger.Warning("Category with id {Id} could not be found", id);
                return AppError.NotFound($"Category with id '{id}' could not be found");
            }

            if (foundEntity.Type == CategoryType.Default)
            {
                _logger.Warning("Category with id {Id} could not be deleted, because it is of type 'Default'", id);
                return AppError.NotFound($"Category with id {id} could not be deleted, because it is of type 'Default'");
            }

            dbContext.Categories.Remove(foundEntity);

            await dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception e)
        {
            _logger.Warning(e, "Error: {Error}", e.Message);
            return AppError.Basic(e.Message);
        }
    }
}
