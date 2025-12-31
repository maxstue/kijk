using Kijk.Api;
using Kijk.Api.Extensions;
using Kijk.Api.Middleware;
using Kijk.Application;
using Kijk.Infrastructure;
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

    builder.AddTelemetryTracking();

    builder.Services
        .AddApplication()
        .AddApi(builder.Configuration)
        .AddInfrastructure(builder.Configuration);

    // ##### Configure the HTTP request pipeline. #####
    var app = builder.Build();
    app.UseRateLimiter();

    app.MapHealthCheck()
        .MapOpenApi()
        .UseStatusCodePages();

    app.UseResponseCompression()
        .UseSecurityHeaders()
        .UseWhen(_ => app.Environment.IsDevelopment(), appBuilder => appBuilder.UseDeveloperExceptionPage())
        .UseWhen(_ => app.Environment.IsProduction(), appBuilder => appBuilder.UseHsts());

    app.MapStaticAssets();

    app.UseExceptionHandler()
        .UseMiddleware<ExtendRequestLoggingMiddleware>()
        .UseRequestLogging()
        .UseForwardedHeaders(new() { ForwardedHeaders = ForwardedHeaders.All })
        .UseCors(AppConstants.Policies.Cors)
        .UseHttpsRedirection()
        .UseAuthentication()
        .UseAuthorization();

    // Both needs to ba after Auth so we have user data
    app.UseMiddleware<TelemetryMiddleware>();
    app.UseMiddleware<CurrentUserMiddleware>();

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