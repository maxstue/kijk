namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Shortens an e-mail address for display, for example <c>anna.mueller@gmail.com</c> to <c>an***@gm***.com</c>. Kijk
/// stores only this form for invitations by e-mail; the inviting admin recognizes the address without Kijk keeping it.
/// </summary>
public static class EmailMask
{
    private const int VisibleCharacters = 2;
    private const string Hidden = "***";

    /// <summary>Shortens an e-mail address.</summary>
    /// <param name="email">A syntactically valid e-mail address.</param>
    /// <returns>The shortened address.</returns>
    public static string Mask(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        var at = email.LastIndexOf('@');
        var local = at > 0 ? email[..at] : email;
        var domain = at > 0 ? email[(at + 1)..] : string.Empty;
        var dot = domain.LastIndexOf('.');
        var host = dot > 0 ? domain[..dot] : domain;
        var topLevel = dot > 0 ? domain[dot..] : string.Empty;

        return $"{Shorten(local)}@{Shorten(host)}{topLevel}".ToLowerInvariant();
    }

    private static string Shorten(string part) => part[..Math.Min(VisibleCharacters, part.Length)] + Hidden;
}