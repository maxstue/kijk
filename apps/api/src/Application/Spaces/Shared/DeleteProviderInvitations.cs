namespace Kijk.Application.Spaces.Shared;

/// <summary>Erases provider invitations after their local rows have been deleted.</summary>
/// <param name="ProviderIds">The provider identifiers retained by the durable message.</param>
public sealed record DeleteProviderInvitations(string[] ProviderIds);