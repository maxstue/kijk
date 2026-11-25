namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Names an invitation by its token. The token travels only in the request body, never in a URL, so it does not
/// reach request logs.
/// </summary>
/// <param name="Token">The token from the invitation link.</param>
public sealed record InvitationTokenRequest(string Token);