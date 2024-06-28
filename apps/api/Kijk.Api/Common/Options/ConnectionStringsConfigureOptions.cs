using Microsoft.Extensions.Options;

namespace Kijk.Api.Common.Options;

public class ConnectionStringsConfigureOptions(IConfiguration configuration) : IConfigureOptions<ConnectionStringsOptions>
{
    public void Configure(ConnectionStringsOptions options)
    {
        configuration
            .GetSection(ConnectionStringsOptions.ConnectionStringsPath)
            .Bind(options);
    }
}
