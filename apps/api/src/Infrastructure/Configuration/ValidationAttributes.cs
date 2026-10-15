using System.ComponentModel.DataAnnotations;
using Npgsql;

namespace Kijk.Infrastructure.Configuration;

/// <summary>Validates absolute HTTP and HTTPS addresses represented as a string or URI.</summary>
[AttributeUsage(AttributeTargets.Property)]
internal sealed class HttpUrlAttribute : ValidationAttribute
{
    public HttpUrlAttribute() : base("{0} must be an absolute HTTP or HTTPS URL.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        var uri = value as Uri;
        if (uri is null && value is string text)
        {
            Uri.TryCreate(text, UriKind.Absolute, out uri);
        }

        return uri is { IsAbsoluteUri: true } && uri.Scheme is "http" or "https";
    }
}

/// <summary>Validates positive durations without imposing an arbitrary upper bound.</summary>
[AttributeUsage(AttributeTargets.Property)]
internal sealed class PositiveTimeSpanAttribute : ValidationAttribute
{
    public PositiveTimeSpanAttribute() : base("{0} must be greater than zero.")
    {
    }

    public override bool IsValid(object? value) => value is TimeSpan duration && duration > TimeSpan.Zero;
}

/// <summary>Validates PostgreSQL connection-string syntax without disclosing its contents.</summary>
[AttributeUsage(AttributeTargets.Property)]
internal sealed class PostgresConnectionStringAttribute : ValidationAttribute
{
    public PostgresConnectionStringAttribute() : base("ConnectionStrings__DefaultConnection must be a valid PostgreSQL connection string.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is not string connectionString || string.IsNullOrWhiteSpace(connectionString))
        {
            return false;
        }

        try
        {
            _ = new NpgsqlConnectionStringBuilder(connectionString);
            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}