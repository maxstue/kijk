using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;

namespace Kijk.UnitTests.Domain;

public class ImportDomainTests
{
    private static readonly string[] ExpectedKeywords = ["miete", "oktober", "fur", "wohnung", "inkl"];

    [Test]
    [Arguments("REWE Markt GmbH Filiale 1234", "rewe")]
    [Arguments("rewe", "rewe")]
    [Arguments("Drogerie Müller GmbH & Co. KG", "drogerie muller")]
    [Arguments("Amazon EU S.a.r.l.", "amazon eu")]
    public async Task MerchantNamesAreNormalized(string name, string expected) =>
        await Assert.That(MerchantNameNormalizer.Normalize(name)).IsEqualTo(expected);

    [Test]
    public async Task MerchantNamesWithoutLettersCannotBeRecognized() =>
        await Assert.That(MerchantNameNormalizer.Normalize("GmbH 1234")).IsNull();

    [Test]
    public async Task PurposeScrubberRemovesIdentifiers()
    {
        var scrubbed = PurposeScrubber.Scrub("Miete DE89 3704 0044 0532 0130 00 EREF: ABC123 Kunde 1234567890 erika@example.test");

        await Assert.That(scrubbed).IsEqualTo("Miete [IBAN] [REF] Kunde [NR] [EMAIL]");
    }

    [Test]
    public async Task PurposeScrubberKeepsOrdinaryText() =>
        await Assert.That(PurposeScrubber.Scrub("Gehalt Oktober 2026")).IsEqualTo("Gehalt Oktober 2026");

    [Test]
    public async Task PurposeRetentionKeepsTruncatesOrRemoves()
    {
        var purpose = new string('a', 60);

        await Assert.That(PurposeScrubber.ApplyRetention(purpose, PurposeRetention.Keep)).IsEqualTo(purpose);
        await Assert.That(PurposeScrubber.ApplyRetention(purpose, PurposeRetention.Truncate)!.Length).IsEqualTo(PurposeScrubber.TruncatedLength + 1);
        await Assert.That(PurposeScrubber.ApplyRetention(purpose, PurposeRetention.Remove)).IsNull();
    }

    [Test]
    public async Task CoverageTreatsMonthsBetweenFirstAndLastBookingAsFull()
    {
        var (full, edge) = ImportCoverage.Analyze([Date(2026, 9, 29), Date(2026, 10, 20), Date(2026, 12, 2)]);

        await Assert.That(full).IsEquivalentTo(new[] { Date(2026, 10, 1), Date(2026, 11, 1) });
        await Assert.That(edge).IsEquivalentTo(new[] { Date(2026, 9, 1), Date(2026, 12, 1) });
    }

    [Test]
    public async Task CoverageOfASingleMonthIsAnEdgeMonth()
    {
        var (full, edge) = ImportCoverage.Analyze([Date(2026, 10, 3), Date(2026, 10, 30)]);

        await Assert.That(full).IsEmpty();
        await Assert.That(edge).IsEquivalentTo(new[] { Date(2026, 10, 1) });
    }

    [Test]
    public async Task NewHouseholdsGetACashAccount()
    {
        var household = Household.Create("Test");

        await Assert.That(household.Accounts.Single().Kind).IsEqualTo(AccountKind.Cash);
    }

    [Test]
    public async Task ImportJobWalksThroughItsStatesAndCannotBeCancelledWhenDone()
    {
        var household = Household.Create("Test");
        var job = ImportJob.Create("export.csv", Account.Create("Giro", null, household), User.Init("auth", "Test", null), household);

        await Assert.That(job.StartAnalysis()).IsTrue();
        job.ProposeMapping("{}", MappingSource.Suggestion);
        await Assert.That(job.ConfirmMapping("{}")).IsTrue();
        await Assert.That(job.StartReading(100, 1)).IsTrue();
        job.ReportProgress(100, 6);
        job.FinishReading([], [Date(2026, 10, 1)]);
        await Assert.That(job.Status).IsEqualTo(ImportJobStatus.NeedsReview);
        await Assert.That(job.HasHighErrorRate).IsTrue();

        job.Complete([Date(2026, 10, 1)], [], 94, DateTime.UtcNow);
        await Assert.That(job.Cancel(DateTime.UtcNow)).IsFalse();
        await Assert.That(job.Status).IsEqualTo(ImportJobStatus.Done);
    }

    [Test]
    public async Task CandidatesWithErrorsStayExcluded()
    {
        var candidate = ImportCandidate.CreateInvalid(Guid.NewGuid(), 3, "Invalid date in column 1");

        candidate.SetExcluded(false);

        await Assert.That(candidate.Excluded).IsTrue();
    }

    [Test]
    public async Task PurposeKeywordsSkipNumbersPlaceholdersAndShortWords() =>
        await Assert.That(PurposeKeywords.Words("Miete Oktober 2026 [IBAN] für Wohnung, inkl. NK"))
            .IsEquivalentTo(ExpectedKeywords);

    [Test]
    public async Task PurposeKeywordsMatchWholeWordsOnly()
    {
        await Assert.That(PurposeKeywords.Contains("Miete November", "miete")).IsTrue();
        await Assert.That(PurposeKeywords.Contains("Mietkaution", "miete")).IsFalse();
        await Assert.That(PurposeKeywords.Normalize("Größe")).IsEqualTo("grosse");
    }

    private static DateTime Date(int year, int month, int day) => new(year, month, day, 0, 0, 0, DateTimeKind.Utc);
}