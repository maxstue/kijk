using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="User" />.</summary>
public class UserConfig : IEntityTypeConfiguration<User>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable(table =>
        {
            table.HasCheckConstraint("ck_users_name_trimmed", "name = btrim(name)");
            table.HasCheckConstraint("ck_users_tag_range", $"tag BETWEEN {User.MinTag} AND {User.MaxTag}");
        });
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.AuthId).IsUnique();
        // Name and number form the unique name (Max#4821); the collation makes it unique ignoring case.
        builder.HasIndex(x => new { x.Name, x.Tag }).IsUnique();

        builder.Property(x => x.AuthId).HasMaxLength(100);
        builder.Property(x => x.Name).HasMaxLength(100).UseCollation(AppDbContext.CaseInsensitiveCollation);
        builder.Property(x => x.Email).HasMaxLength(100);
        builder.Property(x => x.Image).HasMaxLength(250);

        builder.Ignore(x => x.UniqueName);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasMany(x => x.Resources)
            .WithMany()
            .UsingEntity("users_resources");

        builder.Navigation(x => x.Resources)
            .HasField("_resources")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}