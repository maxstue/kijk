namespace Kijk.Application.Users.CompleteOnboarding;

/// <summary>Removes the signup invitation metadata after the account and Inbox have been saved.</summary>
/// <param name="AuthId">The identity whose metadata is cleared.</param>
public sealed record ClearInvitationMetadata(string AuthId);