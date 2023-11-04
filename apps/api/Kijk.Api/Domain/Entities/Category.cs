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

    private Category(Guid id, string name, string color, CategoryType type, List<User> users) : base(id)
    {
        Name = name;
        Color = color;
        Type = type;
        Users = users;
    }

    public string Name { get; set; }

    /// <summary>
    /// A color which represents the category.
    /// IMPORTANT: needs to be a hex-color.
    /// </summary>
    public string Color { get; set; }

    public CategoryType Type { get; set; }

    public List<Transaction> Transactions { get; set; } = new();

    public List<User> Users { get; set; } = new();

    public static Category Create(string name, string color, CategoryType type = CategoryType.Default, User? user = default) =>
        new(Guid.NewGuid(), name, color, type, user is null ? new List<User>() : new List<User> { user });

    public CategoryDto MapToDto() => new(this.Id, this.Name, this.Color, this.Type);
}
