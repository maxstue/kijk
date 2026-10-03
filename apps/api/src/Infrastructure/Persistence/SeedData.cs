namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// Shared values for data seeded through entity configurations.
/// </summary>
internal static class SeedData
{
    /// <summary>
    /// The fixed creation timestamp of seeded household roles and permissions.
    /// </summary>
    internal static readonly DateTime CreatedAt = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
}