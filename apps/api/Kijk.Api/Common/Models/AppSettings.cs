namespace Kijk.Api.Common.Models;

public class AppSettings
{
    public ConnectionStrings ConnectionStrings { get; set; } = default!;

    public AzureAd AzureAd { get; set; } = default!;
}

public class ConnectionStrings
{
    public string DefaultConnection { get; set; } = default!;
}

public class AzureAd
{
    public string Instance { get; set; } = default!;

    public string TenantId { get; set; } = default!;

    public string ClientId { get; set; } = default!;

    public string Scopes { get; set; } = default!;
}
