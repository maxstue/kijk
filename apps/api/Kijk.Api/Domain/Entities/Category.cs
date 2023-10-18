using Kijk.Api.Common.Models;

using NetEscapades.EnumGenerators;

namespace Kijk.Api.Domain.Entities;

[EnumExtensions]
public enum CategoryType
{
    Default,
    User
}

public class Category : BaseEntity
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

    public CategoryDto MapToDto()
    {
        return new CategoryDto(this.Id, this.Name, this.Color, this.Type);
    }
}
