namespace Kijk.Api.Domain.Entities;

public sealed class User : BaseEntity
{
    public string? AuthId { get; private set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public bool? FirstTime { get; set; }

    public List<Transaction> Transactions { get; set; } = [];

    public List<Category> Categories { get; set; } = [];

    public User SetDefaultCategories(bool? useDefaultCategories, List<Category> defaultCategories)
    {
        switch (useDefaultCategories)
        {
            case true:
                Categories.AddRange(defaultCategories);
                break;
            case false:
                Categories.RemoveAll(x => defaultCategories.Select(c => c.Id).Contains(x.Id));
                break;
        }

        return this;
    }

    public static User Create(string? authId, string name, string? email, List<Category>? categories = default, bool? firstTime = false)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            AuthId = authId,
            Name = name,
            Email = email,
            FirstTime = firstTime,
            Categories = categories ?? new List<Category>()
        };
    }
}
