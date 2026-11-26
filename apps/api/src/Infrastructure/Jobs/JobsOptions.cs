using System.ComponentModel.DataAnnotations;
using Wolverine;

namespace Kijk.Infrastructure.Jobs;

/// <summary>
/// Settings of the background job processing.
/// </summary>
public sealed class JobsOptions
{
    /// <summary>Gets the configuration section name.</summary>
    public static string SectionName => "Jobs";

    /// <summary>Gets or sets how Wolverine coordinates durable messages between nodes.</summary>
    [EnumDataType(typeof(DurabilityMode))]
    public DurabilityMode DurabilityMode { get; set; } = DurabilityMode.Balanced;

    /// <summary>
    /// Gets or sets whether the hourly cleanups are scheduled. Integration tests turn this off, so no occurrence runs
    /// while a test is checking data that a cleanup would delete.
    /// </summary>
    public bool CleanupSchedulesEnabled { get; set; } = true;
}