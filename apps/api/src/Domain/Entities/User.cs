using Kijk.Shared.Exceptions;

namespace Kijk.Domain.Entities;

public sealed class User : BaseEntity
{
    /// <summary>
    /// The Id of the user in the authentication provider.
    /// </summary>
    public required string AuthId { get; init; }

    public required string Name { get; set; }

    public string? Email { get; set; }

    public string? Image { get; set; }

    /// <summary>
    /// Indicates if the user is a first time user.
    /// The user is considered a first time user if they have not finished the onboarding/welcome process.
    /// </summary>
    public bool FirstTime { get; set; }

    public List<UserHousehold> UserHouseholds { get; set; } = [];

    /// <summary>
    /// Returns the active household id for the user.
    /// It should never be null as it is set when the user is created.
    /// </summary>
    /// <returns></returns>
    public Guid GetActiveHouseHoldId() => UserHouseholds.SingleOrDefault(x => x.IsActive)?.HouseholdId
                                          ?? throw new NullException("Active household not found");

    public List<Resource> Resources { get; set; } = [];

    public void SetDefaultResources(bool useDefault, List<Resource> defaultResources)
    {
        if (useDefault)
        {
            Resources.AddRange(defaultResources);
        }
        else
        {
            Resources.RemoveAll(x => defaultResources.Select(c => c.Id).Contains(x.Id));
        }
    }

    public static User Init(string authId, string name, string? email) => new()
    {
        Id = Guid.CreateVersion7(),
        AuthId = authId,
        Name = name,
        Email = email,
        FirstTime = true,
        Resources = [],
    };
}