using System.Net;
using System.Text.Json;
using Clerk.BackendAPI;
using Clerk.BackendAPI.Models.Components;
using Clerk.BackendAPI.Models.Errors;
using Clerk.BackendAPI.Models.Operations;
using Kijk.Application.Shared.Identity;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Clerk application invitations for Kijk invitations by e-mail. The invitation's public metadata carries only the Kijk
/// invitation id; Clerk copies it to the identity that signs up through the invitation.
/// </summary>
/// <param name="clerkBackendApi">The Clerk SDK.</param>
/// <param name="httpClient">
/// A client for the Clerk Backend API (see <see cref="Configure" />); the SDK cannot delete invitations yet.
/// </param>
public sealed class ClerkInvitations(ClerkBackendApi clerkBackendApi, HttpClient httpClient) : IIdentityInvitations
{
    /// <summary>The public metadata key that holds the Kijk invitation id.</summary>
    internal const string InvitationMetadataKey = "kijkInvitationId";

    // DELETE /v1/invitations/{id} exists since this API version.
    private const string ApiVersion = "2025-11-10";

    /// <summary>Configures the HTTP client for the Clerk Backend API.</summary>
    /// <param name="client">The client.</param>
    /// <param name="secretKey">The Clerk secret key.</param>
    public static void Configure(HttpClient client, string secretKey)
    {
        client.DefaultRequestHeaders.Authorization = new("Bearer", secretKey);
        client.DefaultRequestHeaders.Add("Clerk-API-Version", ApiVersion);
    }

    /// <inheritdoc />
    public async Task<string?> FindByVerifiedEmailAsync(string email, CancellationToken cancellationToken)
    {
        var response = await WithoutBodyAsync(() => clerkBackendApi.Users
            .ListAsync(new GetUserListRequest { EmailAddress = [email], Limit = 2 })
            .WaitAsync(cancellationToken));

        return response.UserList?
            .FirstOrDefault(user => user.EmailAddresses.Exists(address =>
                string.Equals(address.EmailAddressValue, email, StringComparison.OrdinalIgnoreCase) && IsVerified(address.Verification)))
            ?.Id;
    }

    /// <inheritdoc />
    public async Task<string> InviteAsync(string email, Guid invitationId, TimeSpan lifetime, CancellationToken cancellationToken)
    {
        var request = new CreateInvitationRequestBody
        {
            EmailAddress = email,
            PublicMetadata = new() { [InvitationMetadataKey] = invitationId.ToString() },
            ExpiresInDays = (long)Math.Ceiling(lifetime.TotalDays),
            Notify = true,
            // Several spaces may invite the same person before they sign up.
            IgnoreExisting = true
        };

        var response = await WithoutBodyAsync(() => clerkBackendApi.Invitations.CreateAsync(request).WaitAsync(cancellationToken));
        return response.Invitation?.Id ?? throw new InvalidOperationException("Clerk did not return the created invitation.");
    }

    /// <inheritdoc />
    public async Task DeleteInvitationAsync(string providerInvitationId, CancellationToken cancellationToken)
    {
        // The same server as the SDK's other calls.
        var serverUrl = clerkBackendApi.SDKConfiguration.GetTemplatedServerUrl().TrimEnd('/');
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{serverUrl}/invitations/{Uri.EscapeDataString(providerInvitationId)}");
        using var response = await SendDeletionAsync(request, cancellationToken);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            // Already deleted, e.g. by a previous run of the cleanup.
            return;
        }

        // The response body is not part of the exception, so no address can reach logs or error tracking.
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException("Clerk could not delete the invitation.", null, response.StatusCode);
        }
    }

    private async Task<HttpResponseMessage> SendDeletionAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        try
        {
            return await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new HttpRequestException("Clerk did not finish the invitation deletion in time.");
        }
    }

    /// <inheritdoc />
    public async Task ClearInvitationIdAsync(string authId, CancellationToken cancellationToken)
    {
        // Clerk merges metadata; a null value removes the key.
        var request = new UpdateUserMetadataRequestBody
        {
            PublicMetadata = new() { [InvitationMetadataKey] = null! }
        };

        try
        {
            await WithoutBodyAsync(() => clerkBackendApi.Users.UpdateMetadataAsync(authId, request).WaitAsync(cancellationToken));
        }
        catch (HttpRequestException error) when (error.StatusCode == HttpStatusCode.NotFound)
        {
            // A deleted identity has no metadata to clear.
        }
    }

    /// <summary>Reads the Kijk invitation id from public metadata.</summary>
    /// <param name="metadata">The identity's public metadata.</param>
    /// <returns>The invitation id, or <see langword="null" />.</returns>
    internal static Guid? ReadInvitationId(Dictionary<string, object>? metadata)
    {
        if (metadata is null || !metadata.TryGetValue(InvitationMetadataKey, out var value))
        {
            return null;
        }

        var text = value switch
        {
            JsonElement { ValueKind: JsonValueKind.String } json => json.GetString(),
            string raw => raw,
            _ => null
        };

        return Guid.TryParse(text, out var invitationId) ? invitationId : null;
    }

    // Clerk's error messages repeat the response body, which can contain the e-mail address. Only the status code
    // continues to logs and error tracking.
    private static async Task<T> WithoutBodyAsync<T>(Func<Task<T>> call)
    {
        try
        {
            return await call();
        }
        catch (SDKBaseError error)
        {
            throw new HttpRequestException("A Clerk invitation request failed.", null, error.Response.StatusCode);
        }
    }

    internal static bool IsVerified(Verification? verification) => verification is not null && (
        verification.Otp?.Status == VerificationStatus.Verified ||
        verification.EmailLink?.Status == VerificationEmailLinkVerificationStatus.Verified ||
        verification.Ticket?.Status == VerificationTicketVerificationStatus.Verified ||
        verification.FromOAuth?.Status == VerificationFromOauthVerificationStatus.Verified ||
        verification.VerificationSAMLVerificationEmailAddressSAML?.Status == VerificationSamlVerificationStatus.Verified ||
        verification.VerificationSCIM?.Status == VerificationScimVerificationStatus.Verified ||
        verification.Admin is not null);
}