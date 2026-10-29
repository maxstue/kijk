using Kijk.Api;
using Kijk.Api.Extensions;
using Kijk.Api.Middleware;
using Kijk.Application;
using Kijk.Infrastructure;
using Kijk.Infrastructure.Jobs;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Application is starting ...");
try
{
    // ##### Add services to the container. #####
    var builder = WebApplication.CreateBuilder(args);

    builder.WebHost.UseKestrel(options => options.AddServerHeader = false);

    // Sentry hooks into the web host; PostHog and the traces of both tools are registered by AddInfrastructure.
    builder.AddTelemetryTracking();

    builder.Services
        .AddApplication()
        .AddApi()
        .AddInfrastructure(builder.Configuration)
        .AddBackgroundJobs(builder.Configuration);

    // ##### Configure the HTTP request pipeline. #####
    var app = builder.Build();

    // Initialize Sentry before workers or requests can log their first exception.
    _ = app.Services.GetRequiredService<IHub>();

    app.MapHealthCheck()
        .MapOpenApi()
        .UseStatusCodePages();

    app.UseResponseCompression()
        .UseSecurityHeaders();

    if (app.Environment.IsProduction())
    {
        app.UseHsts();
    }

    app.MapStaticAssets();

    app.UseExceptionHandler()
        .UseMiddleware<CorrelationIdMiddleware>()
        .UseRequestLogging()
        .UseForwardedHeaders(new() { ForwardedHeaders = ForwardedHeaders.All })
        .UseHttpsRedirection()
        .UseAuthentication()
        .UseRateLimiter();

    app.UseMiddleware<CurrentUserMiddleware>();
    app.UseAuthorization();

    app.MapEndpoints();

    await app.RunAsync();
    return 0;
}
catch (HostAbortedException)
{
    //https://github.com/dotnet/efcore/issues/29809
    Log.Information("Application terminated expectedly by e.g. 'dotnet ef'");
    return 1;
}
catch (Exception ex)
{
    Log.Fatal(ex, "Unhandled exception");
    return 2;
}
finally
{
    Log.Information("Application is shutting down ...");
    await Log.CloseAndFlushAsync();
}