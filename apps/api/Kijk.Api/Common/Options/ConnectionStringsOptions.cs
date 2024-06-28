namespace Kijk.Api.Common.Options;

public class ConnectionStringsOptions
{
    public const string ConnectionStringsPath = "ConnectionStrings";
    public const string DefaultConnectionStringPath = "DefaultConnection";
    public const string DefaultConnectionStringFullPath = $"{ConnectionStringsPath}:{DefaultConnectionStringPath}";

    public string DefaultConnection { get; set; } = default!;
}
