using Kijk.Shared;

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

    /// <summary>Gets the common guide version to which the completed steps belong.</summary>
    public int GuideCompletedVersion { get; private set; }

    /// <summary>Gets the completed subtours of that common guide version.</summary>
    public string[] GuideCompletedSteps { get; private set; } = [];

    /// <summary>Gets when this user last completed or skipped the introduction of the associated guide version (UTC).</summary>
    public DateTime? GuideCompletedAt { get; private set; }

    /// <summary>Clears only product introduction progress so the next visit behaves like a new guide.</summary>
    public void ResetGuide()
    {
        GuideCompletedVersion = 0;
        GuideCompletedSteps = [];
        GuideCompletedAt = null;
    }

    /// <summary>Completes one subtour, retaining other completions of the same guide version.</summary>
    /// <param name="version">The common content version of the entire guide.</param>
    /// <param name="step">The completed subtour id.</param>
    /// <param name="completedAt">The server time when the full tour finishes; null for a subtour.</param>
    public void CompleteGuideStep(int version, string step, DateTime? completedAt = null)
    {
        if (!PrepareGuideVersion(version))
        { return; }
        GuideCompletedAt = completedAt ?? GuideCompletedAt;
        GuideCompletedSteps = [.. GuideCompletedSteps.Append(step).Distinct(StringComparer.Ordinal)];
    }

    /// <summary>Completes or skips the introduction without marking unvisited sections as completed.</summary>
    /// <param name="version">The common content version of the guide.</param>
    /// <param name="utcNow">The server time of completion or skipping (UTC).</param>
    public void CompleteGuide(int version, DateTime utcNow)
    {
        if (PrepareGuideVersion(version))
        { GuideCompletedAt = utcNow; }
    }

    private bool PrepareGuideVersion(int version)
    {
        if (version < GuideCompletedVersion)
        { return false; }
        if (version > GuideCompletedVersion)
        {
            GuideCompletedSteps = [];
            GuideCompletedAt = null;
        }
        GuideCompletedVersion = version;
        return true;
    }



    /// <summary>
    /// Gets whether the user turned the AI features on. Off by default, because they rely on the user's consent; when
    /// off, no AI call is made for this user.
    /// </summary>
    public bool AiEnabled { get; private set; }

    /// <summary>
    /// Gets when the user explicitly consented (GDPR Article 9(2)(a)) to Kijk processing bank transactions that may
    /// reveal special categories of personal data (UTC), or <see langword="null" /> without that consent.
    /// </summary>
    public DateTime? SensitiveDataConsentAt { get; private set; }

    /// <summary>Gets when the user asked to delete their account and all their data (UTC), while it is in progress.</summary>
    public DateTime? DeletionRequestedAt { get; private set; }

    /// <summary>Gets the user's space memberships.</summary>
    public ICollection<UserSpace> UserSpaces { get; init; } = new List<UserSpace>();

    /// <summary>
    /// Units created by this user.
    /// </summary>
    public ICollection<Unit> Units { get; init; } = new List<Unit>();

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

    /// <summary>Gives or withdraws the consent to process bank transactions that may reveal sensitive data.</summary>
    /// <param name="consented">Whether the user consents.</param>
    /// <param name="utcNow">The current time.</param>
    public void SetSensitiveDataConsent(bool consented, DateTime utcNow) =>
        SensitiveDataConsentAt = consented ? SensitiveDataConsentAt ?? utcNow : null;

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