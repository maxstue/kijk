namespace Kijk.Api.Domain;

public abstract class BaseEntity
{
    protected BaseEntity(Guid id)
    {
        Id = id;
    }
    
    public Guid Id { get; init; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }
}
