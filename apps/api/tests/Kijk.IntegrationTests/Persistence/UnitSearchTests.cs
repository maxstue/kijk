using Kijk.Application.Units.List;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class UnitSearchTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task SearchSupportsCaseInsensitiveNamesAndSymbolsAndLiteralWildcards()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var owner = User.Init("unit-search", "Owner", null);
        var unit = new Unit
        {
            Name = @"Café 100%_\test",
            Symbol = "mW",
            QuantityKey = "Custom:search",
            CreatorType = CreatorType.User,
            ConversionType = UnitConversionType.None,
            OwnerUser = owner
        };
        db.AddRange(owner, unit);
        await db.SaveChangesAsync();
        var current = new CurrentUser
        {
            User = new SimpleAuthUser(owner.Id, owner.AuthId, Guid.Empty, owner.Name, null, true)
        };
        var handler = new ListHandler(db, current);

        foreach (var search in new[] { " CAFÉ ", "afÉ", "MW", "%", "_", @"\", @"100%_\test", "Cafe", "100x", "missing%" })
        {
            var result = await handler.HandleAsync(new(UnitScope.Personal, Search: search), CancellationToken.None);
            var expectedCount = search is "Cafe" or "100x" or "missing%" ? 0 : 1;

            await Assert.That(result.IsSuccess).IsTrue();
            await Assert.That(result.Value.CustomCount).IsEqualTo(expectedCount);
            await Assert.That(result.Value.Items.Any(item => item.Id == unit.Id)).IsEqualTo(expectedCount == 1);
            if (search is "%" or "_" or @"\")
            {
                await Assert.That(result.Value.TotalCount).IsEqualTo(1);
            }
        }
    }
}