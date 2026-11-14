using System.Text;
using Kijk.Application.Consumptions.Import;
using Kijk.Application.Consumptions.ImportTemplate;
using Kijk.Application.Consumptions.Record;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Kijk.IntegrationTests.Persistence;

public partial class ConsumptionWorkflowTests
{
    private static readonly DateTimeOffset ImportNow = new(2026, 9, 8, 12, 0, 0, TimeSpan.Zero);

    [Test]
    public async Task ImportSavesAllRowsAndCalculatesTheirConsumption()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);

        var result = await ImportAsync(dbContext, fixture.CurrentUser,
            "Date,Name,Resource,Unit,ValueType,Value\n" +
            "2026-01-01,Baseline,Electricity,kWh,Absolute,1000\n" +
            "2026-01-20,,Electricity,,Absolute,1060\n" +
            "2026-02-10,Top-up,electricity,,Relative,30\n");

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value.ImportedCount).IsEqualTo(3);
        await Assert.That(result.Value.SkippedCount).IsEqualTo(0);
        await Assert.That(result.Value.ErrorCount).IsEqualTo(0);

        await using var verify = PostgreSqlTestDatabase.CreateDbContext();
        var saved = await verify.Consumptions.OrderBy(item => item.Date).ToListAsync();
        await Assert.That(saved.Select(item => item.Name)).IsEquivalentTo(["Baseline", "Electricity", "Top-up"]);
        await Assert.That(saved.Select(item => item.CalculatedConsumption)).IsEquivalentTo([0m, 60m, 30m]);
        await Assert.That(saved.All(item => item.ResourceId == fixture.Resource.Id && item.SpaceId == fixture.Space.Id)).IsTrue();
    }

    [Test]
    public async Task ImportKeepsTheFileOrderOfReadingsOnTheSameDayAfterSaving()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);
        var csv = new StringBuilder("Date,Name,Resource,Value\n");
        for (var index = 0; index < 20; index++)
        {
            csv.Append(System.Globalization.CultureInfo.InvariantCulture, $"2026-01-01,Reading {index:D2},Electricity,{1000 + index}\n");
        }

        var result = await ImportAsync(dbContext, fixture.CurrentUser, csv.ToString());

        await Assert.That(result.Value.ImportedCount).IsEqualTo(20);
        await using var verify = PostgreSqlTestDatabase.CreateDbContext();
        var saved = await verify.Consumptions.ToListAsync();
        await Assert.That(saved.Select(item => item.CreatedAt).Distinct().Count()).IsEqualTo(20);
        await Assert.That(Kijk.Domain.Services.ConsumptionTimelineCalculator.RecalculateUntilInvalid(saved)).IsNull();
        await Assert.That(saved.OrderBy(item => item.CreatedAt).Select(item => item.Name))
            .IsEquivalentTo(Enumerable.Range(0, 20).Select(index => $"Reading {index:D2}"), TUnit.Assertions.Enums.CollectionOrdering.Matching);
    }

    [Test]
    public async Task ImportingTheSameFileAgainSkipsExistingConsumptions()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);
        const string csv = "Date,Resource,Value\n2026-01-01,Electricity,1000\n2026-01-20,Electricity,1060\n";

        await ImportAsync(dbContext, fixture.CurrentUser, csv);
        await using var second = PostgreSqlTestDatabase.CreateDbContext();
        var result = await ImportAsync(second, fixture.CurrentUser, csv);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value.ImportedCount).IsEqualTo(0);
        await Assert.That(result.Value.SkippedCount).IsEqualTo(2);
        await Assert.That(await second.Consumptions.CountAsync()).IsEqualTo(2);
    }

    [Test]
    public async Task ImportSavesNothingWhenARowCannotBeImported()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);

        var result = await ImportAsync(dbContext, fixture.CurrentUser,
            "Date,Resource,Value\n" +
            "2026-01-01,Electricity,1000\n" +
            "2026-01-02,Water,3\n" +
            "2026-12-24,Electricity,1100\n");

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value.ImportedCount).IsEqualTo(0);
        await Assert.That(result.Value.ErrorCount).IsEqualTo(2);
        await Assert.That(result.Value.ErrorSamples[0].RowNumber).IsEqualTo(3);
        await Assert.That(result.Value.ErrorSamples[0].Errors).IsEqualTo("Resource 'Water' is not available in this space");
        await Assert.That(result.Value.ErrorSamples[1].RowNumber).IsEqualTo(4);
        await Assert.That(result.Value.ErrorSamples[1].Errors).IsEqualTo("Date must not be in the future");
        await using var verify = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verify.Consumptions.CountAsync()).IsEqualTo(0);
    }

    [Test]
    public async Task ImportRejectsAReadingThatMakesAnExistingReadingDecrease()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);
        var create = CreateHandler(dbContext, fixture.CurrentUser, new MutableTimeProvider(ImportNow));
        await CreateAsync(create, "Baseline", 1_000m, CreateConsumptionValueTypes.Absolute, fixture.Resource.Id, UtcDate(2026, 1, 1));
        await CreateAsync(create, "Reading", 1_060m, CreateConsumptionValueTypes.Absolute, fixture.Resource.Id, UtcDate(2026, 1, 20));

        await using var importContext = PostgreSqlTestDatabase.CreateDbContext();
        var result = await ImportAsync(importContext, fixture.CurrentUser,
            "Date,Resource,Value\n2026-01-10,Electricity,1100\n");

        await Assert.That(result.Value.ErrorCount).IsEqualTo(1);
        await Assert.That(result.Value.ErrorSamples[0].RowNumber).IsEqualTo(2);
        await Assert.That(result.Value.ErrorSamples[0].Errors).Contains("2026-01-20");
        await using var verify = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verify.Consumptions.CountAsync()).IsEqualTo(2);
        await AssertCalculatedAsync(verify, "Reading", 60m);
    }

    [Test]
    public async Task ImportRestartsTheMeterAfterAMeterReplacementAndKeepsItInTheExport()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);

        var result = await ImportAsync(dbContext, fixture.CurrentUser,
            "Date,Resource,Value,StartsNewMeterSegment\n" +
            "2026-01-01,Electricity,1000,false\n" +
            "2026-01-20,Electricity,1060,false\n" +
            "2026-02-01,Electricity,5,true\n" +
            "2026-02-20,Electricity,45,false\n");

        await Assert.That(result.Value.ImportedCount).IsEqualTo(4);
        await using var verify = PostgreSqlTestDatabase.CreateDbContext();
        var saved = await verify.Consumptions.OrderBy(item => item.Date).ToListAsync();
        await Assert.That(saved.Select(item => item.CalculatedConsumption)).IsEquivalentTo([0m, 60m, 0m, 40m]);
        await Assert.That(saved.Select(item => item.StartsNewMeterSegment)).IsEquivalentTo([false, false, true, false]);

        var export = await new Kijk.Application.Consumptions.Export.ExportHandler(verify, fixture.CurrentUser)
            .MonthAsync(2026, "February", CancellationToken.None);
        await Assert.That(Encoding.UTF8.GetString(export.Value.Content)).Contains("2026-02-01,Electricity,Electricity,kWh,Absolute,5,true,0,");
    }

    [Test]
    public async Task ImportAssignsRowsOfSeveralResourcesAndNeedsTheUnitForAmbiguousNames()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);
        var cubicMeter = await dbContext.Units.SingleAsync(unit => unit.Id == new Guid("11111111-1111-4111-8111-111111111113"));
        var gas = new Resource { Name = "Gas", Unit = cubicMeter, Color = "#334455", Icon = "flame", CreatorType = CreatorType.User, Space = fixture.Space };
        var electricityInCubicMeters = new Resource { Name = "Electricity", Unit = cubicMeter, Color = "#556677", Icon = "zap", CreatorType = CreatorType.User, Space = fixture.Space };
        dbContext.Resources.AddRange(gas, electricityInCubicMeters);
        await dbContext.SaveChangesAsync();

        var ambiguous = await ImportAsync(dbContext, fixture.CurrentUser,
            "Date,Resource,Value\n2026-01-01,Electricity,1000\n");
        var result = await ImportAsync(dbContext, fixture.CurrentUser,
            "Date,Resource,Unit,Value\n2026-01-01,Electricity,kWh,1000\n2026-01-01,Gas,,50\n");

        await Assert.That(ambiguous.Value.ErrorSamples.Single().Errors).IsEqualTo("Resource 'Electricity' exists with several units; add the Unit column");
        await Assert.That(result.Value.ImportedCount).IsEqualTo(2);
        await using var verify = PostgreSqlTestDatabase.CreateDbContext();
        var resourceIds = await verify.Consumptions.Select(item => item.ResourceId).ToListAsync();
        await Assert.That(resourceIds).IsEquivalentTo([fixture.Resource.Id, gas.Id]);
    }

    [Test]
    public async Task ImportTemplateContainsAnImportableExampleForEveryResource()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);

        var template = await new ImportTemplateHandler(dbContext, fixture.CurrentUser, new MutableTimeProvider(ImportNow))
            .HandleAsync(CancellationToken.None);
        var csv = Encoding.UTF8.GetString(template.Value.Content);
        var result = await ImportAsync(dbContext, fixture.CurrentUser, csv);

        await Assert.That(template.Value.FileName).IsEqualTo("consumptions-import-template.csv");
        await Assert.That(csv).Contains("2026-09-08,Electricity reading,Electricity,kWh,Absolute,100,false,0,Example row: replace it with your readings");
        await Assert.That(result.Value.ImportedCount).IsEqualTo(1);
    }

    private static async Task<Result<ConsumptionImportResponse>> ImportAsync(AppDbContext dbContext, CurrentUser currentUser, string csv)
    {
        await using var content = new MemoryStream(Encoding.UTF8.GetBytes(csv));
        return await new ImportHandler(dbContext, currentUser, new MutableTimeProvider(ImportNow), NullLogger<ImportHandler>.Instance)
            .HandleAsync(content, CancellationToken.None);
    }
}