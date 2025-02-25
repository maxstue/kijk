using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Middleware;
using Kijk.Api.Common.Utils;
using Kijk.Shared;

Log.Logger = LoggerUtils.CreateRootLogger();

Log.Information("Application is starting ...");
try
{
    // ##### Add services to the container. #####
    var builder = WebApplication.CreateBuilder(args);

    builder.AddErrorTracking();
    builder.AddLogging();

    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

    builder.Services
        .AddProblemDetail()
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
        .AddModules();

    // ##### Configure the HTTP request pipeline. #####
    var app = builder.Build();
    app.MapOpenApi("{documentName}.json");

    // TODO health check want a user id, why ??
    // TODO the base uri is a scalar Ui without paths, why ?? disbale it completly or add the redirect always
    // TODO remove "/scalar.aspnetcore.js" "v1.json" and "/scalar.js" fromlogs
    if (app.Environment.IsDevelopment())
    {
        app.Map("/", () => Results.Redirect("openapi"));
    }

    app.UseStatusCodePages();
    app.UseResponseCompression()
        .UseSecurityHeaders()
        .UseWhen(_ => app.Environment.IsDevelopment(), appBuilder => appBuilder.UseDeveloperExceptionPage())
        .UseWhen(_ => !app.Environment.IsDevelopment(), appBuilder => appBuilder.UseHsts());

    app.MapStaticAssets();

    app.UseExceptionHandler()
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