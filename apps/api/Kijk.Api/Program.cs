using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Middleware;
using Kijk.Api.Common.Models;
using Kijk.Api.Common.Utils;

Log.Logger = LoggerUtils.CreateRootLogger();

Log.Information("Application is starting ...");
try
{
    // ##### Add services to the container. #####
    var builder = WebApplication.CreateBuilder(args);

    builder.AddErrorTracking();
    builder.AddLogging();

    builder.Services
        .AddDatabase(builder.Configuration)
        .AddAppSettings(builder.Configuration)
        .AddAuth(builder.Configuration)
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

    app.MapOpenApi("api/{documentName}.json");
    if (app.Environment.IsDevelopment())
    {
        app.Map("/", () => Results.Redirect("api/swagger"));
    }

    app.UseResponseCompression()
        .UseSecurityHeaders()
        .UseWhen(_ => app.Environment.IsDevelopment(), appBuilder => appBuilder.UseDeveloperExceptionPage())
        .UseWhen(_ => !app.Environment.IsDevelopment(), appBuilder => appBuilder.UseHsts());

    app.ApplyInitialData();

    app.UseGlobalExceptionHandler()
        .UseAuthExceptionHandler()
        .UseOpenApi()
        .UseMiddleware<ExtendRequestLoggingMiddleware>()
        .UseRequestLogging()
        .UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.All })
        .UseCors(AppConstants.Policies.Cors)
        .UseHttpsRedirection()
        .UseAuthentication()
        .UseAuthorization();

    // Needs to ba after Auth so we have user data
    app.UseMiddleware<CurrentUserMiddleware>();
    app.UseRateLimiter();
    app.MapApiEndpoints()
        .MapHealthCheck();

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
    return 1;
}
finally
{
    Log.Information("Application is shutting down ...");
    await Log.CloseAndFlushAsync();
}