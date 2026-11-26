using Kijk.Application.Shared.Security;

namespace Kijk.Application.Spaces.Shared;

/// <summary>Matches invitation addresses across spaces using the existing fingerprint key and a dedicated purpose.</summary>
internal static class InvitationEmail
{
    public static string Fingerprint(IPseudonymizer pseudonymizer, string email) =>
        pseudonymizer.Compute(Guid.Empty, "space-invitation-email", email.Trim().ToUpperInvariant());
}