namespace Kijk.Api.Domain.Entities;

public sealed class User : BaseEntity
{
    public required string AuthId { get; init; }

    public required string Name { get; set; }

    public string? Email { get; set; }

    public string? Image { get; set; }

    public bool FirstTime { get; set; }

    public List<UserHousehold> UserHouseholds { get; set; } = [];

    public List<Budget> Budgets { get; set; } = [];
    public List<Account> Accounts { get; set; } = [];

    public List<Category> Categories { get; set; } = [];

    public User SetDefaultCategories(bool? useDefaultCategories, List<Category> defaultCategories)
    {
        if (useDefaultCategories == true)
        {
            Categories.AddRange(defaultCategories);
        }
        else if (useDefaultCategories == false)
        {
            Categories.RemoveAll(x => defaultCategories.Select(c => c.Id).Contains(x.Id));
        }

        return this;
    }

    public static User Create(
        string authId,
        string name,
        string? email,
        List<Category>? categories = null,
        bool firstTime = false)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            AuthId = authId,
            Name = name,
            Email = email,
            FirstTime = firstTime,
            Categories = categories ?? [],
        };
    }
}
