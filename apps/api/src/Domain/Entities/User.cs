using Kijk.Shared.Exceptions;

namespace Kijk.Domain.Entities;

public sealed class User : BaseEntity
{
    /// <summary>
    /// The Id of the user in the authentication provider.
    /// </summary>
    public required string AuthId { get; init; }

    public required string Name { get; set; }

    public string? Email { get; init; }

    public string? Image { get; init; }

    /// <summary>
    /// Indicates if the user is a first time user.
    /// The user is considered a first time user if they have not finished the onboarding/welcome process.
    /// </summary>
    public bool FirstTime { get; set; }

    public IEnumerable<UserHousehold> UserHouseholds { get; init; } = [];

    /// <summary>
    /// Returns the active household id for the user.
    /// It should never be null as it is set when the user is created.
    /// </summary>
    /// <returns></returns>
    public Guid GetActiveHouseHoldId() => UserHouseholds.SingleOrDefault(x => x.IsActive)?.HouseholdId
                                          ?? throw new NullException("Active household not found");

    private readonly List<Resource> _resources = [];
    public IEnumerable<Resource> Resources => _resources.AsReadOnly();

    public void DeleteResource(Guid resourceId)
    {
        var resource = _resources.Find(x => x.Id == resourceId) ??
                       throw new ArgumentException($"Resource with id {resourceId} does not exist for user {Id}");

        _resources.Remove(resource);
    }

    public void AddResource(Resource resource)
    {
        if (_resources.Any(x => x.Id == resource.Id))
        {
            throw new ArgumentException($"Resource with id {resource.Id} already exists for user {Id}");
        }

        _resources.Add(resource);
    }

    public void SetDefaultResources(bool useDefault, IEnumerable<Resource> defaultResources)
    {
        if (useDefault)
        {
            _resources.AddRange(defaultResources);
        }
        else
        {
            _resources.RemoveAll(x => defaultResources.Select(c => c.Id).Contains(x.Id));
        }
    }

    public static User Init(string authId, string name, string? email) => new()
    {
        Id = Guid.CreateVersion7(),
        AuthId = authId,
        Name = name,
        Email = email,
        FirstTime = true
    };
}