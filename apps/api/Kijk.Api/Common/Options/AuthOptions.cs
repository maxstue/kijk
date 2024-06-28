namespace Kijk.Api.Common.Options;

public class AuthOptions
{
    public const string AuthOptionsPath = "Auth";

    public string Authority { get; set; } = default!;

    public string AuthorizedParty { get; set; } = default!;
}
