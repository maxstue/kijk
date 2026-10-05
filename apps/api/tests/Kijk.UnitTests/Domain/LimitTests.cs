using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.UnitTests.Domain;

public class LimitTests
{
    [Test]
    public async Task RecordOccurrenceWhenActiveLimitBecomesReachedStoresTimestamp()
    {
        var limit = CreateLimit(active: true);
        var occurredAt = new DateTime(2026, 9, 6, 12, 0, 0, DateTimeKind.Utc);

        limit.RecordOccurrence(wasReached: false, isReached: true, occurredAt);

        await Assert.That(limit.LastOccurrence).IsEqualTo(occurredAt);
    }

    [Test]
    public async Task RecordOccurrenceWhenLimitRemainsReachedDoesNotOverwriteTimestamp()
    {
        var limit = CreateLimit(active: true);
        var firstOccurrence = new DateTime(2026, 9, 6, 12, 0, 0, DateTimeKind.Utc);
        limit.RecordOccurrence(wasReached: false, isReached: true, firstOccurrence);

        limit.RecordOccurrence(wasReached: true, isReached: true, firstOccurrence.AddHours(1));

        await Assert.That(limit.LastOccurrence).IsEqualTo(firstOccurrence);
    }

    [Test]
    public async Task RecordOccurrenceWhenLimitIsInactiveDoesNotStoreTimestamp()
    {
        var limit = CreateLimit(active: false);

        limit.RecordOccurrence(wasReached: false, isReached: true, DateTime.UtcNow);

        await Assert.That(limit.LastOccurrence).IsNull();
    }

    private static Limit CreateLimit(bool active)
    {
        var household = Household.Create("Test household");
        var resource = new Resource
        {
            Name = "Electricity",
            Unit = new Unit
            {
                Name = "Kilowatt hour",
                Symbol = "kWh",
                QuantityKey = "Energy",
                UnitsNetUnitName = "KilowattHour",
                CreatorType = Kijk.Shared.CreatorType.System,
                ConversionType = UnitConversionType.UnitsNet
            },
            Color = "#112233",
            Icon = "zap",
            CreatorType = CreatorType.System
        };
        var user = User.Init("test-user", "Test User", "test@example.invalid");

        return Limit.Create(
            new LimitSettings("Monthly electricity", null, 100, Period.Month, active),
            resource,
            user,
            household);
    }
}