namespace Kijk.Api.Common.Extensions;

public static class WebHostExtensions
{
    public static WebApplicationBuilder UseErrorTracking(this WebApplicationBuilder webHost)
    {
        webHost.WebHost.UseSentry();
        
        return webHost;
    }
}
