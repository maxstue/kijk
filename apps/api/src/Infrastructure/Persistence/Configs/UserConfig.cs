using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

public class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.AuthId);

        builder.Property(x => x.AuthId).HasMaxLength(100);
        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Email).HasMaxLength(100);
        builder.Property(x => x.Image).HasMaxLength(250);

        builder.Property(x => x.FirstTime).HasDefaultValue(true);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasMany(x => x.Resources)
            .WithMany()
            .UsingEntity("users_resources");
    }
}