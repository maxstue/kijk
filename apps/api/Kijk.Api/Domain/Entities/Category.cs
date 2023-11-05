using Kijk.Api.Common.Models;

using NetEscapades.EnumGenerators;

namespace Kijk.Api.Domain.Entities;

[EnumExtensions]
public enum CategoryType
{
    Default,
    User
}

public sealed class Category : BaseEntity
{
    public required string Name { get; set; }

    /// <summary>
    /// A color which represents the category.
    /// IMPORTANT: needs to be a hex-color.
    /// </summary>
    public required string Color { get; set; }

    public CategoryType Type { get; set; }

    public List<Transaction> Transactions { get; set; } = new();

    public List<User> Users { get; set; } = new();

    public static Category Create(string name, string color, CategoryType type = CategoryType.Default, User? user = default)
    {
        return new Category
        {
            Id = Guid.NewGuid(),
            Name = name,
            Color = color,
            Type = type,
            Users = user is null ? new List<User>() : new List<User> { user },
            Transactions = new List<Transaction>()
        };
    }

    public CategoryDto MapToDto() => new(this.Id, this.Name, this.Color, this.Type);
}
