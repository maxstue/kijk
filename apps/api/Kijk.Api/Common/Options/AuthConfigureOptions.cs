using Microsoft.Extensions.Options;

namespace Kijk.Api.Common.Options;

public class AuthConfigureOptions(IConfiguration configuration) : IConfigureOptions<AuthOptions>
{
    public void Configure(AuthOptions options)
    {
        configuration
            .GetSection(AuthOptions.AuthOptionsPath)
            .Bind(options);
    }
}
