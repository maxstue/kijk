namespace Kijk.Api.Domain.Entities;

public class User : BaseEntity
{
    public required string Name { get; set; }

    public string? AuthId { get; set; }

    public string? Email { get; set; }

    public List<Transaction> Transactions { get; set; } = new();

    public List<Category> Categories { get; set; } = new();
}
