namespace Kijk.Domain.Entities;

/// <summary>
/// A confirmed column mapping for one bank export format. The next import with the same header uses it without asking
/// again. Every correction stores a new version.
/// </summary>
public sealed class ImportProfile : BaseEntity
{
    /// <summary>Gets the fingerprint of the header row, delimiter and encoding.</summary>
    public required string HeaderFingerprint { get; init; }

    /// <summary>Gets a display name, e.g. the account the format was first confirmed for.</summary>
    public required string Name { get; init; }

    /// <summary>Gets the mapping as JSON.</summary>
    public required string Mapping { get; init; }

    /// <summary>Gets the version; higher versions replace lower ones.</summary>
    public required int Version { get; init; }

    /// <summary>Gets when the mapping was confirmed (UTC).</summary>
    public required DateTime ConfirmedAt { get; init; }

    /// <summary>Gets or sets the id of <see cref="Space" />.</summary>
    public Guid SpaceId { get; set; }

    /// <summary>Gets or sets the space the profile belongs to.</summary>
    public Space? Space { get; set; }
}