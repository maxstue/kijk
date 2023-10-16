using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Categories;

/// <summary>
/// Handles all logic related to <see cref="Category"/>
/// </summary>
public interface ICategoriesService
{
    Task<Result<List<CategoryDto>>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Result<CategoryDto>> CreateAsync(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken = default);

    Task<Result<CategoryDto>> UpdateAsync(Guid id, UpdateCategoryRequest updateCategoryRequest, CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
