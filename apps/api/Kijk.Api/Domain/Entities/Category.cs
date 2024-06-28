using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public sealed class Category : BaseEntity
{
    public required string Name { get; set; }

    /// <summary>
    /// A color which represents the category.
    /// IMPORTANT: needs to be a hex-color.
    /// </summary>
    public required string Color { get; set; }

    public CategoryType Type { get; set; }
    public CategoryCreatorType CreatorType { get; set; }

    public List<Transaction>? Transactions { get; set; }

    public List<User> Users { get; set; } = [];

    public static Category Create(
        string name,
        string color,
        CategoryCreatorType creatorType = CategoryCreatorType.Default,
        CategoryType type = CategoryType.Other,
        User? user = default) =>
        new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Color = color,
            CreatorType = creatorType,
            Type = type,
            Users = user is null ? [] : [user]
        };
}
