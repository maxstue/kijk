namespace Kijk.Application.Shared.Security;

/// <summary>
/// Computes pseudonymous keys (HMAC) for identifiers such as IBANs. Equal inputs give equal keys within a household;
/// without the secret key the input cannot be recovered or checked.
/// </summary>
public interface IPseudonymizer
{
    /// <summary>Gets the version of the secret key in use.</summary>
    int KeyVersion { get; }

    /// <summary>Computes a key.</summary>
    /// <param name="householdId">The household; every household uses its own derived key.</param>
    /// <param name="purpose">What the value is, e.g. <c>iban</c> or <c>booking</c>; equal values of different purposes give different keys.</param>
    /// <param name="value">The value.</param>
    /// <returns>The key as a URL-safe Base64 string.</returns>
    string Compute(Guid householdId, string purpose, string value);
}