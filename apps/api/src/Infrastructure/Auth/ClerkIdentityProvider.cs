using System.Text.Json;
using Clerk.BackendAPI;
using Clerk.BackendAPI.Models.Components;
using Clerk.BackendAPI.Models.Operations;
using Kijk.Application.Abstractions.Identity;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Reads Clerk-managed identity data and stores Kijk-specific identity preferences in private metadata.
/// </summary>
public sealed class ClerkIdentityProvider(ClerkBackendApi clerkBackendApi) : IIdentityProvider
{
    private const string KijkMetadataKey = "kijk";
    private const string UseProfileMetadataKey = "useExternalProfile";

    /// <inheritdoc />
    public async Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken)
    {
        var response = await clerkBackendApi.Users.GetAsync(authId).WaitAsync(cancellationToken);
        var user = response.User ?? throw new InvalidOperationException($"Clerk user '{authId}' was not found.");
        var primaryEmail = user.EmailAddresses
            .Find(email => email.Id == user.PrimaryEmailAddressId)
            ?.EmailAddressValue
            ?? (user.EmailAddresses.Count > 0 ? user.EmailAddresses[0].EmailAddressValue : null);
        var fullName = JoinName(user.FirstName, user.LastName);

        return new(
            fullName,
            primaryEmail,
            user.HasImage ? user.ImageUrl : null,
            ReadUseProfilePreference(user.PrivateMetadata));
    }

    /// <inheritdoc />
    public async Task SetUseProfileInKijkAsync(
        string authId,
        bool useProfileInKijk,
        CancellationToken cancellationToken)
    {
        var request = new UpdateUserMetadataRequestBody
        {
            PrivateMetadata = new Dictionary<string, object>
            {
                [KijkMetadataKey] = new Dictionary<string, object>
                {
                    [UseProfileMetadataKey] = useProfileInKijk
                }
            }
        };

        await clerkBackendApi.Users.UpdateMetadataAsync(authId, request).WaitAsync(cancellationToken);
    }

    private static string? JoinName(string? firstName, string? lastName)
    {
        var fullName = string.Join(' ', new[] { firstName, lastName }.Where(name => !string.IsNullOrWhiteSpace(name)));
        return string.IsNullOrWhiteSpace(fullName) ? null : fullName;
    }

    private static bool? ReadUseProfilePreference(Dictionary<string, object>? metadata)
    {
        if (metadata is null || !metadata.TryGetValue(KijkMetadataKey, out var kijkMetadata))
        {
            return null;
        }

        if (kijkMetadata is JsonElement { ValueKind: JsonValueKind.Object } json &&
            json.TryGetProperty(UseProfileMetadataKey, out var preference) &&
            preference.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            return preference.GetBoolean();
        }

        if (kijkMetadata is IReadOnlyDictionary<string, object> dictionary &&
            dictionary.TryGetValue(UseProfileMetadataKey, out var value) &&
            value is bool boolean)
        {
            return boolean;
        }

        return null;
    }
}