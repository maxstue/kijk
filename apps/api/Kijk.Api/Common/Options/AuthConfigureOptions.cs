using Microsoft.Extensions.Options;

namespace Kijk.Api.Common.Options;

public class AuthConfigureOptions : IConfigureOptions<AuthOptions>
{
    private readonly IConfiguration _configuration;

    public AuthConfigureOptions(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void Configure(AuthOptions options)
    {
        _configuration
            .GetSection(AuthOptions.AuthOptionsPath)
            .Bind(options);
    }
}
