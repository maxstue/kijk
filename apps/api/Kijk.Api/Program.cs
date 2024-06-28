using Kijk.Api.Common;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Middleware;
using Kijk.Api.Common.Models;
using Kijk.Api.Common.Utils;

Log.Logger = LoggerUtils.CreateRootLogger();

try
{
    Log.Information("Application is starting ...");

    // ##### Add services to the container. #####
    var builder = WebApplication.CreateBuilder(args);

    builder.AddErrorTracking();
    builder.AddLogging();

    builder.Services
        .AddDatabase()
        .AddAppSettings(builder.Configuration)
        .AddAuth(builder.Configuration)
        .AddExceptionHandler<GlobalExceptionHandler>()
        .AddScoped<ExtendRequestLoggingMiddleware>()
        .AddHttpClient()
        .AddOpenApi(builder.Configuration)
        .AddCorsPolicy(builder.Configuration)
        .AddRateLimitPolicy()
        .AddCompression()
        .AddValidation()
        .AddControllerOptions()
        .AddHealthCheck(builder.Configuration)
        .AddCache()
        .AddModules();

    // ##### Configure the HTTP request pipeline. #####
    var app = builder.Build();

    app.UseExceptionHandler(_ => { })
        .UseAuthExceptionHandler();

    if (app.Environment.IsDevelopment())
    {
        app.ApplyMigrations();
        app.UseDeveloperExceptionPage();
    }

    if (app.Environment.IsProduction())
    {
        app.UseHsts();
    }

    app.ApplyInitialData();

    app.UseHttpsRedirection();
    app.UseSecurityHeaders()
        .UseCustomOpenApi();

    app.UseMiddleware<ExtendRequestLoggingMiddleware>()
        .UseSerilogRequestLogging()
        .UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.All });

    // Authentication, Authorization and Cors
    app.UseCors(AppConstants.Policies.Cors)
        .UseAuthentication()
        .UseAuthorization();

    app.UseResponseCompression();

    // Needs to ba after Auth so we have user data
    app.UseRateLimiter();

    app.MapApiEndpoints()
        .MapHealthCheck();

    app.Run();
}
catch (HostAbortedException)
{
    //https://github.com/dotnet/efcore/issues/29809
    Log.Information("Application terminated expectedly by e.g. 'dotnet ef'");
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.Information("Application is shutting down ...");
    Log.CloseAndFlush();
}
