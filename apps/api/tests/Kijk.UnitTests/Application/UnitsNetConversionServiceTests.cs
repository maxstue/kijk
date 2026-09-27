using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.UnitTests.Application;

public sealed class UnitsNetConversionServiceTests
{
    private readonly UnitsNetConversionService _service = new();

    [Test]
    public async Task ConvertBetweenCompatibleSystemUnits()
    {
        var result = _service.Convert(1_500m, SystemUnit("Liter", "Volume"), SystemUnit("CubicMeter", "Volume"));

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value).IsEqualTo(1.5m);
    }

    [Test]
    public async Task ConvertFactorUnitToSystemUnit()
    {
        var liter = SystemUnit("Liter", "Volume");
        var barrel = new Unit
        {
            Name = "Barrel",
            Symbol = "barrel",
            CreatorType = CreatorType.User,
            ConversionType = UnitConversionType.Factor,
            QuantityKey = "Volume",
            ReferenceUnit = liter,
            ReferenceUnitId = liter.Id,
            ConversionFactor = 159m
        };

        var result = _service.Convert(2m, barrel, liter);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value).IsEqualTo(318m);
    }

    [Test]
    public async Task RejectDifferentQuantities()
    {
        var result = _service.Convert(1m, SystemUnit("Liter", "Volume"), SystemUnit("KilowattHour", "Energy"));

        await Assert.That(result.IsError).IsTrue();
    }

    private static Unit SystemUnit(string name, string quantity) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Symbol = name,
        CreatorType = CreatorType.System,
        ConversionType = UnitConversionType.UnitsNet,
        QuantityKey = quantity,
        UnitsNetUnitName = name
    };
}