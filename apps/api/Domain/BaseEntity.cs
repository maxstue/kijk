namespace Kijk.Domain;

/// <summary>
/// The base entity for all entities.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; init; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }
}