using System.Collections.Concurrent;
using Kijk.Application.Shared.Identity;

namespace Kijk.IntegrationTests.Http;

// Stands in for the authentication provider's accounts, invitations and public metadata.
internal sealed class FakeIdentityInvitations : IIdentityInvitations
{
    private int _nextInvitation;

    /// <summary>Verified e-mail addresses and the identities that own them.</summary>
    public ConcurrentDictionary<string, string> Accounts { get; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Provider invitations that were sent and not deleted, with their address and Kijk invitation.</summary>
    public ConcurrentDictionary<string, (string Email, Guid InvitationId)> Invitations { get; } = new();

    public ConcurrentQueue<string> Deleted { get; } = new();

    /// <summary>The Kijk invitation ids in the identities' public metadata.</summary>
    public ConcurrentDictionary<string, Guid> Metadata { get; } = new();

    public Task<string?> FindByVerifiedEmailAsync(string email, CancellationToken cancellationToken) =>
        Task.FromResult(Accounts.TryGetValue(email, out var authId) ? authId : null);

    public Task<string> InviteAsync(string email, Guid invitationId, TimeSpan lifetime, CancellationToken cancellationToken)
    {
        var id = $"inv_{Interlocked.Increment(ref _nextInvitation)}";
        Invitations[id] = (email, invitationId);
        return Task.FromResult(id);
    }

    public Task DeleteInvitationAsync(string providerInvitationId, CancellationToken cancellationToken)
    {
        Invitations.TryRemove(providerInvitationId, out _);
        Deleted.Enqueue(providerInvitationId);
        return Task.CompletedTask;
    }

    public Task<Guid?> GetInvitationIdAsync(string authId, CancellationToken cancellationToken) =>
        Task.FromResult(Metadata.TryGetValue(authId, out var id) ? id : (Guid?)null);

    public Task ClearInvitationIdAsync(string authId, CancellationToken cancellationToken)
    {
        Metadata.TryRemove(authId, out _);
        return Task.CompletedTask;
    }

    /// <summary>Signs up through a provider invitation: the identity receives its Kijk invitation id.</summary>
    public void SignUp(string providerInvitationId, string authId) => Metadata[authId] = Invitations[providerInvitationId].InvitationId;
}