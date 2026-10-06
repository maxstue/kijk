using Kijk.Shared;
using Kijk.Shared.Exceptions;

namespace Kijk.Domain.Entities;

/// <summary>A Kijk user, linked to an identity of the authentication provider.</summary>
public sealed class User : BaseEntity
{
    /// <summary>
    /// The Id of the user in the authentication provider.
    /// </summary>
    public required string AuthId { get; init; }

    /// <summary>Gets or sets the display name.</summary>
    public required string Name { get; set; }

    /// <summary>Gets the email address.</summary>
    public string? Email { get; init; }

    /// <summary>Gets the profile image URL.</summary>
    public string? Image { get; init; }

    /// <summary>Gets the analytics preference, or <see langword="null" /> before the user decided.</summary>
    public AnalyticsConsent? AnalyticsConsent { get; private set; }

    /// <summary>Gets when the analytics preference last changed (UTC).</summary>
    public DateTime? AnalyticsConsentUpdatedAt { get; private set; }

    /// <summary>Gets when onboarding was completed (UTC), or <see langword="null" /> while it is pending.</summary>
    public DateTime? OnboardingCompletedAt { get; private set; }

    /// <summary>
    /// Gets whether the user has completed onboarding.
    /// </summary>
    public bool OnboardingCompleted => OnboardingCompletedAt.HasValue;

    /// <summary>Gets whether the user allows AI features. When off, no AI call is made for this user.</summary>
    public bool AiEnabled { get; private set; } = true;

    /// <summary>Gets when the user asked to delete their account and all their data (UTC), while it is in progress.</summary>
    public DateTime? DeletionRequestedAt { get; private set; }

    /// <summary>Gets the user's space memberships.</summary>
    public ICollection<UserSpace> UserSpaces { get; init; } = new List<UserSpace>();

    /// <summary>
    /// Units created by this user.
    /// </summary>
    public ICollection<Unit> Units { get; init; } = new List<Unit>();

    /// <summary>
    /// Returns the active space id for the user.
    /// It should never be null as it is set when the user is created.
    /// </summary>
    /// <returns>The active space id.</returns>
    /// <exception cref="NullException">The user has no active space.</exception>
    public Guid GetActiveSpaceId() => UserSpaces.SingleOrDefault(x => x.IsActive)?.SpaceId ?? throw new NullException("Active space not found");

    private readonly List<Resource> _resources = [];
    /// <summary>Gets the resources the user has enabled.</summary>
    public IEnumerable<Resource> Resources => _resources;

    /// <summary>Removes an enabled resource.</summary>
    /// <param name="resourceId">The resource id.</param>
    /// <exception cref="ArgumentException">The resource is not enabled for the user.</exception>
    public void DeleteResource(Guid resourceId)
    {
        var resource = _resources.Find(x => x.Id == resourceId) ?? throw new ArgumentException($"Resource with id {resourceId} does not exist for user {Id}");

        _resources.Remove(resource);
    }

    /// <summary>Enables a resource.</summary>
    /// <param name="resource">The resource.</param>
    /// <exception cref="ArgumentException">The resource is already enabled.</exception>
    public void AddResource(Resource resource)
    {
        if (_resources.Any(x => x.Id == resource.Id))
        {
            throw new ArgumentException($"Resource with id {resource.Id} already exists for user {Id}");
        }

        _resources.Add(resource);
    }

    /// <summary>Enables or disables the system default resources.</summary>
    /// <param name="useDefault">Whether the default resources should be enabled.</param>
    /// <param name="defaultResources">The system default resources.</param>
    public void SetDefaultResources(bool useDefault, List<Resource> defaultResources)
    {
        var resourceIds = _resources.Select(x => x.Id).ToHashSet();
        var defaultResourceIds = defaultResources.Select(x => x.Id).ToHashSet();

        if (useDefault)
        {
            _resources.AddRange(defaultResources.Where(x => !resourceIds.Contains(x.Id)));
        }
        else
        {
            _resources.RemoveAll(x => defaultResourceIds.Contains(x.Id));
        }
    }

    /// <summary>Completes onboarding with the chosen name and analytics preference.</summary>
    /// <param name="displayName">The display name.</param>
    /// <param name="analyticsConsent">The analytics preference.</param>
    /// <param name="completedAt">The completion time (UTC).</param>
    public void CompleteOnboarding(string displayName, AnalyticsConsent analyticsConsent, DateTime completedAt)
    {
        Name = displayName;
        AnalyticsConsent = analyticsConsent;
        AnalyticsConsentUpdatedAt = completedAt;
        OnboardingCompletedAt = completedAt;
    }

    /// <summary>
    /// Resets onboarding when the user no longer belongs to a space.
    /// </summary>
    public void ResetOnboarding() => OnboardingCompletedAt = null;

    /// <summary>Records that the user asked to delete their account and all their data.</summary>
    /// <param name="utcNow">The current time.</param>
    public void RequestDeletion(DateTime utcNow) => DeletionRequestedAt ??= utcNow;

    /// <summary>Turns the AI features on or off for this user.</summary>
    /// <param name="enabled">Whether AI features are allowed.</param>
    public void SetAiEnabled(bool enabled) => AiEnabled = enabled;

    /// <summary>Changes the analytics preference.</summary>
    /// <param name="analyticsConsent">The new preference.</param>
    /// <param name="updatedAt">The change time (UTC).</param>
    public void UpdateAnalyticsConsent(AnalyticsConsent analyticsConsent, DateTime updatedAt)
    {
        AnalyticsConsent = analyticsConsent;
        AnalyticsConsentUpdatedAt = updatedAt;
    }

    /// <summary>Creates a user whose onboarding is still pending.</summary>
    /// <param name="authId">The authentication provider's user id.</param>
    /// <param name="name">The display name.</param>
    /// <param name="email">The email address.</param>
    /// <returns>The new user.</returns>
    public static User Init(string authId, string name, string? email) => new()
    {
        AuthId = authId,
        Name = name,
        Email = email
    };
}