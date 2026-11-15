using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;

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
    public async Task ConvertBetweenLengthUnits()
    {
        var result = _service.Convert(1.5m, SystemUnit("Kilometer", "Length"), SystemUnit("Meter", "Length"));

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value).IsEqualTo(1_500m);
    }

    [Test]
    public async Task KeepTheValueForTheSameUnitEvenWithoutConversion()
    {
        var piece = SystemUnit(null, "Count");

        var result = _service.Convert(3m, piece, piece);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value).IsEqualTo(3m);
    }

    [Test]
    public async Task RejectUnitsWithoutConversion()
    {
        var result = _service.Convert(3m, SystemUnit(null, "Count"), SystemUnit(null, "Count"));

        await Assert.That(result.IsError).IsTrue();
    }

    [Test]
    public async Task RejectDifferentQuantities()
    {
        var result = _service.Convert(1m, SystemUnit("Liter", "Volume"), SystemUnit("KilowattHour", "Energy"));

        await Assert.That(result.IsError).IsTrue();
    }

    private static Unit SystemUnit(string? unitsNetUnitName, string quantity) => new()
    {
        Id = Guid.NewGuid(),
        Name = unitsNetUnitName ?? "Piece",
        Symbol = unitsNetUnitName ?? "pcs",
        QuantityKey = quantity,
        UnitsNetUnitName = unitsNetUnitName
    };
}