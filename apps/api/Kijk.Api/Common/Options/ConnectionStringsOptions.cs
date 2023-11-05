namespace Kijk.Api.Common.Options;

public class ConnectionStringsOptions
{
    public const string ConnectionStringsPath = "ConnectionStrings";

    public string DefaultConnection { get; set; } = default!;
}
