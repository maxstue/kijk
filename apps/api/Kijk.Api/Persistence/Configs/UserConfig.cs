using Kijk.Api.Domain.Entities;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class UserConfig : IEntityTypeConfiguration<User>
{

    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable(nameof(User).ToLower());
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.AuthId);

        builder.Property(x => x.FirstTime).HasDefaultValue(true);

        builder.HasMany(x => x.Transactions).WithOne(x => x.User).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Categories).WithMany(x => x.Users);
    }
}
