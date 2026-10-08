namespace Kijk.Domain;

/// <summary>
/// The base entity for all entities.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets when the entity was created (UTC).</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Gets or sets when the entity was last updated (UTC); set by the database.</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Gets or sets when the entity was soft-deleted (UTC).</summary>
    public DateTime? DeletedAt { get; set; }
}