using Kijk.Application.Imports.Categorization;
using Kijk.Application.Shared.Ai;
using Kijk.Shared;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging.Abstractions;

namespace Kijk.UnitTests.Imports;

public class TransactionCategorizerTests
{
    private static readonly CategoryOption Food = new(Guid.NewGuid(), "Groceries", CategoryKind.Expense);
    private static readonly CategoryOption Salary = new(Guid.NewGuid(), "Income", CategoryKind.Income);

    [Test]
    public async Task OnlyAllowedCategoriesOfTheRightKindAreAccepted()
    {
        var chat = new FakeChatClient("""{"results":[{"id":0,"category":0},{"id":1,"category":7},{"id":2,"category":0},{"id":3,"category":-1},{"id":99,"category":0}]}""");
        var items = new[]
        {
            new CategorizationItem(0, "REWE", null, false),
            new CategorizationItem(1, "Kino", null, false),
            new CategorizationItem(2, "Arbeitgeber GmbH", "Gehalt", true),
            new CategorizationItem(3, "Unklar", null, false)
        };

        var result = await Create(chat, allowed: true).CategorizeAsync(Guid.NewGuid(), Guid.NewGuid(), items, [Food, Salary], CancellationToken.None);

        await Assert.That(result.Assignments).HasCount(1);
        await Assert.That(result.Assignments[0]).IsEqualTo(Food.Id);
        await Assert.That(result.Unavailable).IsFalse();
    }

    [Test]
    public async Task ContextsAreSentInBatchesWithinTheLimit()
    {
        var chat = new FakeChatClient("""{"results":[]}""");
        var items = Enumerable.Range(0, AiTransactionCategorizer.BatchSize * 2 + 1)
            .Select(id => new CategorizationItem(id, "Shop", null, false))
            .ToList();

        await Create(chat, allowed: true).CategorizeAsync(Guid.NewGuid(), Guid.NewGuid(), items, [Food], CancellationToken.None);

        await Assert.That(chat.Calls).IsEqualTo(3);
    }

    [Test]
    public async Task NothingIsSentWhenTheGateRefuses()
    {
        var chat = new FakeChatClient("""{"results":[]}""");

        var result = await Create(chat, allowed: false).CategorizeAsync(
            Guid.NewGuid(), Guid.NewGuid(), [new CategorizationItem(0, "REWE", null, false)], [Food], CancellationToken.None);

        await Assert.That(chat.Calls).IsEqualTo(0);
        await Assert.That(result.Unavailable).IsTrue();
        await Assert.That(result.Assignments).IsEmpty();
    }

    [Test]
    public async Task AnUnreachableOrGarbledAiLeavesEverythingUncategorized()
    {
        var items = new[] { new CategorizationItem(0, "REWE", null, false) };

        var unreachable = await Create(new FakeChatClient(null), allowed: true).CategorizeAsync(Guid.NewGuid(), Guid.NewGuid(), items, [Food], CancellationToken.None);
        var garbled = await Create(new FakeChatClient("Probably groceries"), allowed: true).CategorizeAsync(Guid.NewGuid(), Guid.NewGuid(), items, [Food], CancellationToken.None);

        await Assert.That(unreachable.Unavailable).IsTrue();
        await Assert.That(garbled.Unavailable).IsTrue();
        await Assert.That(unreachable.Assignments).IsEmpty();
        await Assert.That(garbled.Assignments).IsEmpty();
    }

    private static AiTransactionCategorizer Create(IChatClient chat, bool allowed) =>
        new(chat, new Gate(allowed), NullLogger<AiTransactionCategorizer>.Instance);

    private sealed class Gate(bool allowed) : IAiGate
    {
        public Task<bool> CanUseAiAsync(Guid spaceId, Guid userId, CancellationToken cancellationToken) => Task.FromResult(allowed);
    }

    private sealed class FakeChatClient(string? answer) : IChatClient
    {
        private int _calls;

        public int Calls => _calls;

        public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
        {
            Interlocked.Increment(ref _calls);
            return answer is null
                ? throw new HttpRequestException("unavailable")
                : Task.FromResult(new ChatResponse(new ChatMessage(ChatRole.Assistant, answer)));
        }

        public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public object? GetService(Type serviceType, object? serviceKey = null) => null;

        public void Dispose()
        {
        }
    }
}