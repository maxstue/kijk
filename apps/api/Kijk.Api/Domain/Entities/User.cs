namespace Kijk.Api.Domain.Entities;

public sealed class User : BaseEntity
{
    private User(Guid id, string? authId, string name, string? email, bool? firstTime = false) : base(id)
    {
        AuthId = authId;
        Name = name;
        Email = email;
        FirstTime = firstTime;
    }

    public string? AuthId { get; private set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public bool? FirstTime { get; set; }

    public List<Transaction> Transactions { get; set; } = new();

    public List<Category> Categories { get; set; } = new();

    public static User Create(string? authId, string name, string? email, bool? firstTime = false) =>
        new(Guid.NewGuid(), authId, name, email, firstTime);
}
