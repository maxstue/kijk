using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Categories.Models;

public record CategoryResponse(Guid Id, string Name, string Color, CategoryType Type, CategoryCreatorType CreatorType)
{
    public static CategoryResponse Create(Category category) =>
        new(category.Id, category.Name, category.Color, category.Type, category.CreatorType);
}