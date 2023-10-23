using HealthChecks.UI.Client;

using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Middleware;
using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Diagnostics.HealthChecks;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Application is starting ...");

// ##### Add services to the container. #####
var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog(
    (context, services, configuration) =>
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services));

builder.Services.AddAuthentication().AddJwtBearer();

// State that represents the current user from the request
builder.Services.AddCurrentUser();

// TODO only save sub/kinde.id and permissions/roles for a user, because you don't need more on the api level 
// send user data on first "init" request and create the user from these data

// TODO write into custom requirementshandler
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(
        AppConstants.Policies.All,
        policy => policy.RequireClaim("permissions").RequireCurrentUser().Build())

    // .AddPolicy(AppConstants.Policies.User, policy => policy.RequireRole(AppConstants.Roles.User).RequireCurrentUser().Build())
    // .AddPolicy(AppConstants.Policies.Admin, policy => policy.RequireRole(AppConstants.Roles.Admin).RequireCurrentUser().Build())
    .AddCurrentUserHandler();

builder.Services.ConfigureDatabase()
    .AddCustomAppSettings(builder.Configuration)
    .AddCustomCors(builder.Configuration)
    .AddCustomOpenApi(builder.Configuration)
    .AddCustomRateLimiter()
    .AddCustomCompression()
    .AddCustomValidation()
    .AddCustomControllerOptions()
    .AddCustomHealthCheck(builder.Configuration);

builder.Services.AddFusionCache(AppConstants.CacheNames.Base);

builder.Services.RegisterModules();

// ##### Configure the HTTP request pipeline. #####
var app = builder.Build();

app.UseResponseCompression();
app.UseSecurityHeaders();

await app.UseInitDatabase(app.Environment);

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseCustomOpenApi();
}
else
{
    app.UseHsts();
}

app.UseCustomExceptionHandler();
app.UseCustomAuthResponseHandler();

app.UseSerilogRequestLogging();
app.UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.All });
app.UseCors(AppConstants.Policies.Cors);

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Needs to ba after Auth so we have user data
app.UseRateLimiter();

app.MapCustomEndpoints();
app.MapHealthChecks("/health", new HealthCheckOptions { ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse });

app.Run();
