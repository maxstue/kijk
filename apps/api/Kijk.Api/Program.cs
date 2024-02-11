using Kijk.Api.Common;
using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Middleware;
using Kijk.Api.Common.Models;
using Kijk.Api.Common.Utils;

Log.Logger = LoggerUtils.CreateRootLogger();

Log.Information("Application is starting ...");

// ##### Add services to the container. #####
var builder = WebApplication.CreateBuilder(args);

builder.AddErrorTracking()
    .AddLogging();

builder.Services
    .AddDatabase()
    .AddAppSettings(builder.Configuration)
    .AddAuth(builder.Configuration)
    .AddExceptionHandler<GlobalExceptionHandler>()
    .AddScoped<ExtendRequestLoggingMiddleware>()
    .AddHttpClient()
    .AddOpenApi(builder.Configuration)
    .AddCorsPolicy(builder.Configuration)
    .AddRateLimitiPolicy()
    .AddCompression()
    .AddValidation()
    .AddControllerOptions()
    .AddHealthCheck(builder.Configuration)
    .AddCache()
    .AddModules();

// ##### Configure the HTTP request pipeline. #####
var app = builder.Build();

await app.UseInitDatabase(app.Environment);

app.UseResponseCompression()
    .UseSecurityHeaders()
    .UseCustomOpenApi()
    .UseWhen(_ => app.Environment.IsDevelopment(), appBuilder => appBuilder.UseDeveloperExceptionPage())
    .UseWhen(_ => app.Environment.IsProduction(), appBuilder => appBuilder.UseHsts());

app.UseExceptionHandler(_ => { })
    .UseAuthExceptionHandler()
    .UseMiddleware<ExtendRequestLoggingMiddleware>()
    .UseSerilogRequestLogging()
    .UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.All })
    .UseCors(AppConstants.Policies.Cors)
    .UseHttpsRedirection()
    .UseAuthentication()
    .UseAuthorization();

// Needs to ba after Auth so we have user data
app.UseRateLimiter()
    .MapCustomEndpoints()
    .MapHealthCheck();

app.Run();
