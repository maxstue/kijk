using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;

namespace Kijk.UnitTests.Domain;

public class ConsumptionTimelineCalculatorTests
{
    private readonly Household household = Household.Create("Test household");
    private readonly Resource resource = new()
    {
        Name = "Electricity",
        Unit = "kWh",
        Color = "#112233",
        CreatorType = CreatorType.System
    };

    [Test]
    public async Task RelativeEntryUsesEnteredValueAsCalculatedConsumption()
    {
        var consumption = CreateConsumption(2026, 9, 10, 25m, ConsumptionValueType.Relative);

        var result = ConsumptionTimelineCalculator.CalculateInsertion(consumption, []);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(consumption.CalculatedConsumption).IsEqualTo(25m);
    }

    [Test]
    public async Task FirstAbsoluteEntryEstablishesBaselineWithoutConsumption()
    {
        var consumption = CreateConsumption(2026, 9, 1, 1_000m, ConsumptionValueType.Absolute);

        var result = ConsumptionTimelineCalculator.CalculateInsertion(consumption, []);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(consumption.CalculatedConsumption).IsEqualTo(0m);
    }

    [Test]
    public async Task AbsoluteEntryUsesPreviousReadingAndRelativeEntriesAsBaseline()
    {
        var baseline = CreateConsumption(2026, 9, 1, 1_000m, ConsumptionValueType.Absolute);
        var relative = CreateConsumption(2026, 9, 10, 25m, ConsumptionValueType.Relative);
        var consumption = CreateConsumption(2026, 9, 20, 1_060m, ConsumptionValueType.Absolute);

        var result = ConsumptionTimelineCalculator.CalculateInsertion(consumption, [baseline, relative]);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(consumption.CalculatedConsumption).IsEqualTo(35m);
    }

    [Test]
    public async Task DecreasingAbsoluteEntryReturnsValidationError()
    {
        var baseline = CreateConsumption(2026, 9, 1, 1_000m, ConsumptionValueType.Absolute);
        var consumption = CreateConsumption(2026, 9, 10, 900m, ConsumptionValueType.Absolute);

        var result = ConsumptionTimelineCalculator.CalculateInsertion(consumption, [baseline]);

        await Assert.That(result.IsError).IsTrue();
        await Assert.That(result.Error.Description).Contains("must not be lower");
    }

    [Test]
    public async Task HistoricalRelativeEntryRecalculatesNextAbsoluteEntry()
    {
        var baseline = CreateConsumption(2026, 9, 1, 1_000m, ConsumptionValueType.Absolute);
        var nextAbsolute = CreateConsumption(2026, 9, 20, 1_100m, ConsumptionValueType.Absolute);
        nextAbsolute.CalculatedConsumption = 100m;
        var consumption = CreateConsumption(2026, 9, 10, 30m, ConsumptionValueType.Relative);

        var result = ConsumptionTimelineCalculator.CalculateInsertion(consumption, [baseline, nextAbsolute]);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(consumption.CalculatedConsumption).IsEqualTo(30m);
        await Assert.That(nextAbsolute.CalculatedConsumption).IsEqualTo(70m);
    }

    [Test]
    public async Task RecalculateAfterDeletingRelativeEntryClosesAbsoluteGap()
    {
        var baseline = CreateConsumption(2026, 9, 1, 1_000m, ConsumptionValueType.Absolute);
        var nextAbsolute = CreateConsumption(2026, 9, 20, 1_100m, ConsumptionValueType.Absolute);

        var result = ConsumptionTimelineCalculator.Recalculate([baseline, nextAbsolute]);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(nextAbsolute.CalculatedConsumption).IsEqualTo(100m);
    }

    [Test]
    public async Task RecalculateAfterEditingAbsoluteEntryUpdatesFollowingReading()
    {
        var baseline = CreateConsumption(2026, 9, 1, 1_000m, ConsumptionValueType.Absolute);
        var edited = CreateConsumption(2026, 9, 10, 1_040m, ConsumptionValueType.Absolute);
        var nextAbsolute = CreateConsumption(2026, 9, 20, 1_100m, ConsumptionValueType.Absolute);

        var result = ConsumptionTimelineCalculator.Recalculate([baseline, edited, nextAbsolute]);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(edited.CalculatedConsumption).IsEqualTo(40m);
        await Assert.That(nextAbsolute.CalculatedConsumption).IsEqualTo(60m);
    }

    private Consumption CreateConsumption(
        int year,
        int month,
        int day,
        decimal value,
        ConsumptionValueType valueType) =>
        Consumption.Create(
            "Reading",
            resource,
            value,
            household,
            new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc),
            valueType,
            calculatedConsumption: 0m);
}