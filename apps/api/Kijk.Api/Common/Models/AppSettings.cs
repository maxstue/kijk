using System.ComponentModel.DataAnnotations;

namespace Kijk.Api.Common.Models;

public class AppSettings
{
    public ConnectionStrings ConnectionStrings { get; set; } = default!;

    public Auth Auth { get; set; } = default!;
}

public class ConnectionStrings
{
    public string DefaultConnection { get; set; } = default!;
}

public class Auth
{
    public string Instance { get; set; } = default!;

    public string TenantId { get; set; } = default!;

    public string ClientId { get; set; } = default!;

    public string Scopes { get; set; } = default!;
}
