using Kijk.Application.Consumptions.Import;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.UnitTests.Application;

public class ResourceMatcherTests
{
    private readonly Resource electricity = CreateResource("Electricity", "kWh");
    private readonly Resource electricityInWattHours = CreateResource("Electricity", "Wh");
    private readonly Resource gas = CreateResource("Gas", "m³");

    [Test]
    public async Task MatchesAUniqueNameIgnoringCase()
    {
        var result = ResourceMatcher.Match([electricity, gas], "gas", null);

        await Assert.That(result.Value).IsSameReferenceAs(gas);
    }

    [Test]
    public async Task NeedsTheUnitWhenSeveralResourcesShareTheName()
    {
        var ambiguous = ResourceMatcher.Match([electricity, electricityInWattHours], "Electricity", null);
        var byUnit = ResourceMatcher.Match([electricity, electricityInWattHours], "Electricity", "WH");

        await Assert.That(ambiguous.Error.Description).IsEqualTo("Resource 'Electricity' exists with several units; add the Unit column");
        await Assert.That(byUnit.Value).IsSameReferenceAs(electricityInWattHours);
    }

    [Test]
    public async Task ExplainsAMissingResource()
    {
        var unknown = ResourceMatcher.Match([electricity], "Water", null);
        var wrongUnit = ResourceMatcher.Match([electricity], "Electricity", "m³");

        await Assert.That(unknown.Error.Type).IsEqualTo(ErrorType.Validation);
        await Assert.That(unknown.Error.Description).IsEqualTo("Resource 'Water' is not available in this space");
        await Assert.That(wrongUnit.Error.Description).IsEqualTo("Resource 'Electricity' with unit 'm³' is not available in this space");
    }

    private static Resource CreateResource(string name, string symbol) => new()
    {
        Name = name,
        Unit = new Unit
        {
            Name = symbol,
            Symbol = symbol,
            QuantityKey = $"Custom:{symbol}"
        },
        Color = "#112233",
        Icon = "zap",
        CreatorType = CreatorType.User
    };
}