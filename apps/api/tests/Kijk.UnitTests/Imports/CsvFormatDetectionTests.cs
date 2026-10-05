using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Detection;
using Kijk.Application.Shared.Ai;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging.Abstractions;

namespace Kijk.UnitTests.Imports;

public class CsvFormatDetectionTests
{
    private const string DkbAnswer = """
        {"dateColumn":0,"dateFormat":"dd.MM.yy","amountColumn":8,"debitColumn":-1,"creditColumn":-1,"decimalSeparator":",",
         "counterpartyColumn":4,"payerColumn":3,"purposeColumn":5,"counterpartyIbanColumn":7,"creditorIdColumn":9,
         "statusColumn":2,"bookingTypeColumn":-1}
        """;

    // Values of the synthetic export that must never reach the AI.
    private static readonly string[] SecretValues =
        ["Erika", "REWE", "Mustermann", "Stadtwerke", "DE89370400440532013000", "DE98ZZZ09999999999", "Miete", "750", "1.234,56", "DE00 1234"];

    [Test]
    [Arguments("-1.234,56", "-9.999,99")]
    [Arguments("30.11.26", "99.99.99")]
    [Arguments("2.500", "9.999")]
    [Arguments("DE89370400440532013000", "<IBAN>")]
    [Arguments("DE89 3704 0044 0532 0130 00", "<IBAN>")]
    [Arguments("DE98ZZZ09999999999", "<CREDITOR-ID>")]
    [Arguments("M-0001", "A-9999")]
    [Arguments("Lastschrift", "Lastschrift")]
    [Arguments("Gebucht", "Gebucht")]
    [Arguments("Max Mustermann", "<TEXT:14>")]
    [Arguments("Miete Oktober", "<TEXT:13>")]
    [Arguments("", "")]
    public async Task ValuesAreReplacedByTheirPattern(string value, string expected) =>
        await Assert.That(CsvMasker.MaskValue(value)).IsEqualTo(expected);

    [Test]
    [Arguments("Buchungsdatum", "Buchungsdatum")]
    [Arguments("Betrag (€)", "Betrag (€)")]
    [Arguments("Zahlungsempfänger*in", "Zahlungsempfänger*in")]
    [Arguments("Kontostand vom 30.11.2026:", "<TEXT:26>")]
    [Arguments("DE89370400440532013000", "<TEXT:22>")]
    public async Task OnlyPlainColumnNamesAreKept(string header, string expected) =>
        await Assert.That(CsvMasker.MaskHeader(header)).IsEqualTo(expected);

    [Test]
    public async Task TheAiSeesNeitherMetadataNorValues()
    {
        var (table, mapping) = CsvSamples.Detect("dkb-synthetic.csv");
        var chat = new FakeChatClient(DkbAnswer);

        var result = await CreateDetector(chat).DetectAsync(Guid.NewGuid(), Guid.NewGuid(), table, ';', CsvDecoder.Utf8, mapping.HeaderRowIndex, CancellationToken.None);

        await Assert.That(result.Outcome).IsEqualTo(CsvFormatDetectionOutcome.Detected);
        await Assert.That(result.Mapping!.AmountColumn).IsEqualTo(8);
        await Assert.That(result.Mapping.BankReferenceColumn).IsNull();
        var sent = string.Join('\n', chat.Requests.Single().Select(message => message.Text));
        await Assert.That(sent).Contains("Buchungsdatum");
        foreach (var secret in SecretValues)
        {
            await Assert.That(sent.Contains(secret, StringComparison.OrdinalIgnoreCase)).IsFalse();
        }
    }

    [Test]
    public async Task MappingsThatDoNotParseTheRowsAreRejected()
    {
        var (table, mapping) = CsvSamples.Detect("dkb-synthetic.csv");
        // Column 3 holds names, not dates.
        var chat = new FakeChatClient(DkbAnswer.Replace("\"dateColumn\":0", "\"dateColumn\":3", StringComparison.Ordinal));

        var result = await CreateDetector(chat).DetectAsync(Guid.NewGuid(), Guid.NewGuid(), table, ';', CsvDecoder.Utf8, mapping.HeaderRowIndex, CancellationToken.None);

        await Assert.That(result.Outcome).IsEqualTo(CsvFormatDetectionOutcome.Rejected);
    }

    [Test]
    public async Task UnreadableAnswersAreRejectedAndFailuresReportUnavailable()
    {
        var (table, mapping) = CsvSamples.Detect("dkb-synthetic.csv");

        var garbage = await CreateDetector(new FakeChatClient("I think column 0 is the date.")).DetectAsync(Guid.NewGuid(), Guid.NewGuid(), table, ';', CsvDecoder.Utf8, mapping.HeaderRowIndex, CancellationToken.None);
        var failing = await CreateDetector(new FakeChatClient(null)).DetectAsync(Guid.NewGuid(), Guid.NewGuid(), table, ';', CsvDecoder.Utf8, mapping.HeaderRowIndex, CancellationToken.None);

        await Assert.That(garbage.Outcome).IsEqualTo(CsvFormatDetectionOutcome.Rejected);
        await Assert.That(failing.Outcome).IsEqualTo(CsvFormatDetectionOutcome.Unavailable);
    }

    [Test]
    public async Task ProvidersWithoutJsonSchemaSupportAreAskedInJsonMode()
    {
        var (table, mapping) = CsvSamples.Detect("dkb-synthetic.csv");
        var chat = new FakeChatClient(DkbAnswer, rejectJsonSchema: true);

        var result = await CreateDetector(chat).DetectAsync(Guid.NewGuid(), Guid.NewGuid(), table, ';', CsvDecoder.Utf8, mapping.HeaderRowIndex, CancellationToken.None);

        await Assert.That(result.Outcome).IsEqualTo(CsvFormatDetectionOutcome.Detected);
        await Assert.That(chat.Requests.Count).IsEqualTo(2);
    }

    [Test]
    public async Task NothingIsSentWhenTheGateDeniesAi()
    {
        var (table, mapping) = CsvSamples.Detect("dkb-synthetic.csv");
        var chat = new FakeChatClient(DkbAnswer);

        var result = await new AiCsvFormatDetector(chat, new Gate(false), NullLogger<AiCsvFormatDetector>.Instance)
            .DetectAsync(Guid.NewGuid(), Guid.NewGuid(), table, ';', CsvDecoder.Utf8, mapping.HeaderRowIndex, CancellationToken.None);

        await Assert.That(result.Outcome).IsEqualTo(CsvFormatDetectionOutcome.NotAllowed);
        await Assert.That(chat.Requests).IsEmpty();
    }

    private static AiCsvFormatDetector CreateDetector(IChatClient chat) =>
        new(chat, new Gate(true), NullLogger<AiCsvFormatDetector>.Instance);

    private sealed class Gate(bool allowed) : IAiGate
    {
        public Task<bool> CanUseAiAsync(Guid householdId, Guid userId, CancellationToken cancellationToken) => Task.FromResult(allowed);
    }

    /// <summary>Answers with a fixed text, or throws when the text is null.</summary>
    private sealed class FakeChatClient(string? answer, bool rejectJsonSchema = false) : IChatClient
    {
        public List<List<ChatMessage>> Requests { get; } = [];

        public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
        {
            Requests.Add([.. messages]);
            if (answer is null || rejectJsonSchema && options?.ResponseFormat is ChatResponseFormatJson { Schema: not null })
            {
                throw new HttpRequestException("unavailable");
            }

            return Task.FromResult(new ChatResponse(new ChatMessage(ChatRole.Assistant, answer)));
        }

        public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public object? GetService(Type serviceType, object? serviceKey = null) => null;

        public void Dispose()
        {
        }
    }
}