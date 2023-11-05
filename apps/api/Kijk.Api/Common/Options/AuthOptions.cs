namespace Kijk.Api.Common.Options;

public class AuthOptions
{
    public const string AuthOptionsPath = "Auth";

    public string ValidAudience { get; set; } = default!;

    public string IssuerSigningKey { get; set; } = default!;

}
