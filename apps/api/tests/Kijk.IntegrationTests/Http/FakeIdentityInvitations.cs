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

    public Func<CancellationToken, Task>? BeforeSending { get; set; }
    public string? FailingDeletion { get; set; }
    public bool FailFirstMetadataClear { get; set; }
    public int MetadataClearAttempts { get; private set; }

    /// <summary>The Kijk invitation ids in the identities' public metadata.</summary>
    public ConcurrentDictionary<string, Guid> Metadata { get; } = new();

    public Task<string?> FindByVerifiedEmailAsync(string email, CancellationToken cancellationToken) =>
        Task.FromResult(Accounts.TryGetValue(email, out var authId) ? authId : null);

    public async Task<string> InviteAsync(string email, Guid invitationId, TimeSpan lifetime, CancellationToken cancellationToken)
    {
        if (BeforeSending is { } beforeSending)
        {
            await beforeSending(cancellationToken);
        }

        var id = $"inv_{Interlocked.Increment(ref _nextInvitation)}";
        Invitations[id] = (email, invitationId);
        return id;
    }

    public Task DeleteInvitationAsync(string providerInvitationId, CancellationToken cancellationToken)
    {
        if (providerInvitationId == FailingDeletion)
        {
            throw new HttpRequestException("Provider unavailable");
        }

        Invitations.TryRemove(providerInvitationId, out _);
        Deleted.Enqueue(providerInvitationId);
        return Task.CompletedTask;
    }

    public Task ClearInvitationIdAsync(string authId, CancellationToken cancellationToken)
    {
        MetadataClearAttempts++;
        if (FailFirstMetadataClear && MetadataClearAttempts == 1)
        {
            throw new HttpRequestException("Provider unavailable");
        }

        Metadata.TryRemove(authId, out _);
        return Task.CompletedTask;
    }

    /// <summary>Signs up through a provider invitation: the identity receives its Kijk invitation id.</summary>
    public void SignUp(string providerInvitationId, string authId)
    {
        var invitation = Invitations[providerInvitationId];
        Accounts[invitation.Email] = authId;
        Metadata[authId] = invitation.InvitationId;
    }
}