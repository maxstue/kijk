namespace Kijk.Api.Domain.Entities;

public class Category : BaseEntity
{
    public required string Name { get; set; }

    public required string Color { get; set; }

    public List<Transaction> Transactions { get; set; } = new();
    public List<User> Users { get; set; } = new();

}
