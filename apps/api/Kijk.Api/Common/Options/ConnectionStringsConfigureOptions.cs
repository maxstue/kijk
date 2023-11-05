using Microsoft.Extensions.Options;

namespace Kijk.Api.Common.Options;

public class ConnectionStringsConfigureOptions : IConfigureOptions<ConnectionStringsOptions>
{
    private readonly IConfiguration _configuration;

    public ConnectionStringsConfigureOptions(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void Configure(ConnectionStringsOptions options)
    {
        _configuration
            .GetSection(ConnectionStringsOptions.ConnectionStringsPath)
            .Bind(options);
    }
}
