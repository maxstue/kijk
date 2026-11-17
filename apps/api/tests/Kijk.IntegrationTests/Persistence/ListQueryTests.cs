using Kijk.Application.Accounts.List;
using Kijk.Application.Categories.List;
using Kijk.Application.CategoryRules.List;
using Kijk.Application.Resources.List;
using Kijk.Application.Shared.Paging;
using Kijk.Application.Transactions.Queries;
using Kijk.Application.Transactions.Shared;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TUnit.Assertions.Enums;

using AccountListHandler = Kijk.Application.Accounts.List.ListHandler;
using CategoryListHandler = Kijk.Application.Categories.List.ListHandler;
using CategoryRuleListHandler = Kijk.Application.CategoryRules.List.ListHandler;
using ResourceListHandler = Kijk.Application.Resources.List.ListHandler;

namespace Kijk.IntegrationTests.Persistence;

// The list endpoints search, sort and page on the server; these run the queries against PostgreSQL.
[NotInParallel]
public class ListQueryTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task AccountsAreSearchedIgnoringCaseSortedAndPaged()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        db.AddRange(
            Account.Create("Checking", "1234", fixture.Space),
            Account.Create("Savings", "5678", fixture.Space),
            Account.Create("Check 100%", null, fixture.Space));
        await db.SaveChangesAsync();
        var handler = new AccountListHandler(db, fixture.CurrentUser);

        var search = await handler.HandleAsync(new(Search: " CHECK "), CancellationToken.None);
        var ibanEnding = await handler.HandleAsync(new(Search: "567"), CancellationToken.None);
        var wildcard = await handler.HandleAsync(new(Search: "%"), CancellationToken.None);
        var descending = await handler.HandleAsync(new(Sort: AccountSort.Name, Descending: true, PageSize: 2), CancellationToken.None);
        var pastTheEnd = await handler.HandleAsync(new(Sort: AccountSort.Name, Page: 9, PageSize: 3), CancellationToken.None);
        var all = await handler.HandleAsync(new(), CancellationToken.None);

        await Assert.That(search.Value.Items.Select(item => item.Name)).IsEquivalentTo(["Check 100%", "Checking"]);
        await Assert.That(ibanEnding.Value.Items.Single().Name).IsEqualTo("Savings");
        await Assert.That(wildcard.Value.Items.Single().Name).IsEqualTo("Check 100%");
        await Assert.That(descending.Value.Items.Select(item => item.Name)).IsEquivalentTo(["Savings", "Checking"], CollectionOrdering.Matching);
        // Every space also has its cash account.
        await Assert.That(descending.Value.TotalCount).IsEqualTo(4);
        // Past the last page returns the last page, so deleting its last row does not leave an empty table.
        await Assert.That(pastTheEnd.Value.Page).IsEqualTo(2);
        await Assert.That(pastTheEnd.Value.Items.Single().Name).IsEqualTo("Savings");
        // Without a page the list returns every account in its default order, bank accounts first; selects rely on it.
        await Assert.That(all.Value.Items.Select(item => item.Name)).IsEquivalentTo(["Check 100%", "Checking", "Savings", "Cash"], CollectionOrdering.Matching);
        await Assert.That(all.Value.PageSize).IsEqualTo(4);
    }

    [Test]
    public async Task CategoriesAreSearchedThroughTheCaseInsensitiveCollation()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        db.Add(Category.Create("Pets", "paw-print", "#aa7744", CategoryKind.Expense, fixture.Space));
        await db.SaveChangesAsync();
        var handler = new CategoryListHandler(db, fixture.CurrentUser);

        var result = await handler.HandleAsync(new(Search: "PET"), CancellationToken.None);
        var custom = await handler.HandleAsync(new(Sort: CategorySort.CreatorType, Descending: true, PageSize: 1), CancellationToken.None);

        await Assert.That(result.Value.Items.Single().Name).IsEqualTo("Pets");
        await Assert.That(custom.Value.Items.Single().Name).IsEqualTo("Pets");
        await Assert.That(custom.Value.TotalCount).IsGreaterThan(1);
    }

    [Test]
    public async Task CategoryRulesAreSearchedByLabelAndCategory()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var pets = Category.Create("Pets", "paw-print", "#aa7744", CategoryKind.Expense, fixture.Space);
        var travel = Category.Create("Travel", "plane", "#336699", CategoryKind.Expense, fixture.Space);
        db.AddRange(
            CategoryRule.CreateFromCorrection(CategoryRuleScope.Merchant, "key-1", "Zoo shop", pets, fixture.Space.Id),
            CategoryRule.CreateFromCorrection(CategoryRuleScope.Merchant, "key-2", "Airline", travel, fixture.Space.Id));
        await db.SaveChangesAsync();
        var handler = new CategoryRuleListHandler(db, fixture.CurrentUser);

        var byLabel = await handler.HandleAsync(new(Search: "zoo"), CancellationToken.None);
        var byCategory = await handler.HandleAsync(new(Search: "TRAV"), CancellationToken.None);
        var sorted = await handler.HandleAsync(new(Sort: CategoryRuleSort.Category, Descending: true), CancellationToken.None);

        await Assert.That(byLabel.Value.Items.Single().Label).IsEqualTo("Zoo shop");
        await Assert.That(byCategory.Value.Items.Single().Label).IsEqualTo("Airline");
        await Assert.That(sorted.Value.Items.Select(item => item.CategoryName)).IsEquivalentTo(["Travel", "Pets"], CollectionOrdering.Matching);
    }

    [Test]
    public async Task ResourcesAreSearchedByNameAndUnit()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var kilowattHour = await db.Units.SingleAsync(unit => unit.Id == new Guid("22222222-2222-4222-8222-222222222222"));
        db.Add(new Resource
        {
            Name = "Heat pump",
            Unit = kilowattHour,
            Color = "#112233",
            Icon = "zap",
            CreatorType = CreatorType.User,
            Space = fixture.Space
        });
        await db.SaveChangesAsync();
        var handler = new ResourceListHandler(db, fixture.CurrentUser, NullLogger<ResourceListHandler>.Instance);

        var byName = await handler.HandleAsync(new(Search: "HEAT"), CancellationToken.None);
        var bySymbol = await handler.HandleAsync(new(Search: kilowattHour.Symbol.ToUpperInvariant()), CancellationToken.None);

        await Assert.That(byName.Value.Items.Single().Name).IsEqualTo("Heat pump");
        await Assert.That(bySymbol.Value.Items.Select(item => item.Name)).Contains("Heat pump");
    }

    [Test]
    public async Task TransactionSearchCombinesWithThePeriodAndPages()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var account = Account.Create("Checking", null, fixture.Space);
        var october = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        db.AddRange(
            account,
            CreateTransaction(fixture, account, october.AddDays(1), "Supermarket", null),
            CreateTransaction(fixture, account, october.AddDays(2), "Bakery", "SUPERMARKET coupon"),
            CreateTransaction(fixture, account, october.AddDays(3), "Supermarket", null),
            CreateTransaction(fixture, account, october.AddMonths(-1), "Supermarket", null));
        await db.SaveChangesAsync();
        var handler = new QueriesHandler(db, fixture.CurrentUser);

        var firstPage = await handler.ListAsync(new TransactionFilter(2026, 10, null, null, "supermarket"), 1, 2, CancellationToken.None);
        var secondPage = await handler.ListAsync(new TransactionFilter(2026, 10, null, null, "supermarket"), 2, 2, CancellationToken.None);

        // Counterparty and purpose both match; September is outside the period.
        await Assert.That(firstPage.Value.TotalCount).IsEqualTo(3);
        await Assert.That(firstPage.Value.Items.Select(item => item.BookingDate.Day)).IsEquivalentTo([4, 3], CollectionOrdering.Matching);
        await Assert.That(secondPage.Value.Items.Single().BookingDate.Day).IsEqualTo(2);
    }

    [Test]
    public async Task ImportHistoryFiltersBeforePagingAndHasNoTwentyRowCutoff()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var account = Account.Create("Checking", null, fixture.Space);
        var otherAccount = Account.Create("Savings", null, fixture.Space);
        db.AddRange(account, otherAccount);
        db.AddRange(Enumerable.Range(1, 25).Select(index => ImportJob.Create($"statement-{index:D2}.csv", account, fixture.User, fixture.Space)));
        db.Add(ImportJob.Create("statement-other.csv", otherAccount, fixture.User, fixture.Space));
        await db.SaveChangesAsync();
        var handler = new Kijk.Application.Imports.Queries.QueriesHandler(db, fixture.CurrentUser, new Kijk.Application.Imports.Shared.ImportFileReader(db, new UnusedFileProtector()));
        var result = await handler.ListAsync(new(Search: "STATEMENT", Sort: Kijk.Application.Imports.Queries.ImportSort.FileName, Page: 3, PageSize: 10), ImportJobStatus.Pending, account.Id, CancellationToken.None);
        await Assert.That(result.Value.TotalCount).IsEqualTo(25);
        await Assert.That(result.Value.Items.Select(item => item.FileName)).IsEquivalentTo(Enumerable.Range(21, 5).Select(index => $"statement-{index:D2}.csv"), CollectionOrdering.Matching);
        var all = await handler.ListAsync(new(), null, null, CancellationToken.None);
        await Assert.That(all.Value.TotalCount).IsEqualTo(26);
        var empty = await handler.ListAsync(new(Page: 999, PageSize: 10), ImportJobStatus.Done, null, CancellationToken.None);
        await Assert.That(empty.Value.Items).IsEmpty();
        await Assert.That(empty.Value.Page).IsEqualTo(1);
    }

    [Test]
    public async Task LimitsCombineSearchResourcePeriodSortAndPaging()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var unit = await db.Units.FirstAsync();
        var resource = new Resource { Name = "Electricity", Icon = "zap", Color = "#123456", Unit = unit, Space = fixture.Space, CreatorType = CreatorType.User };
        db.Add(resource);
        db.AddRange(
            Limit.Create(new("Energy month", null, 100m, Period.Month, true), resource, fixture.User, fixture.Space),
            Limit.Create(new("Energy year", null, 200m, Period.Year, true), resource, fixture.User, fixture.Space));
        await db.SaveChangesAsync();
        var handler = new Kijk.Application.Limits.Queries.QueriesHandler(db, fixture.CurrentUser, TimeProvider.System);
        var result = await handler.ListAsync(new(Search: "ENERGY", Sort: Kijk.Application.Limits.Queries.LimitSort.Name, Descending: true, PageSize: 1), resource.Id, null, CancellationToken.None);
        await Assert.That(result.Value.TotalCount).IsEqualTo(2);
        await Assert.That(result.Value.Items.Single().Name).IsEqualTo("Energy year");
        var filtered = await handler.ListAsync(new(Search: "ELECTRICITY", PageSize: 1), resource.Id, Period.Month, CancellationToken.None);
        await Assert.That(filtered.Value.Items.Single().Name).IsEqualTo("Energy month");
        var otherResource = await handler.ListAsync(new(), Guid.NewGuid(), null, CancellationToken.None);
        await Assert.That(otherResource.Value.Items).IsEmpty();
    }

    private static Transaction CreateTransaction(TestFixture fixture, Account account, DateTime date, string counterparty, string? purpose) =>
        Transaction.Create(new TransactionDetails(date, -10m, counterparty, purpose, TransactionStatus.Booked, false), account, fixture.User, fixture.Space);

    private static async Task<TestFixture> CreateFixtureAsync(AppDbContext db)
    {
        var space = Space.Create("Table space");
        var user = User.Init("table-auth", "Table user", "table@example.test");
        db.AddRange(space, user);
        await db.SaveChangesAsync();
        return new TestFixture(
            space,
            user,
            new CurrentUser { User = new SimpleAuthUser(user.Id, user.AuthId, space.Id, user.Name, user.Email, true) });
    }

    private sealed class UnusedFileProtector : Kijk.Application.Imports.Shared.IImportFileProtector
    {
        public byte[] Protect(byte[] content) => throw new InvalidOperationException("Listing must not read files");
        public byte[] Unprotect(byte[] content) => throw new InvalidOperationException("Listing must not read files");
    }

    private sealed record TestFixture(Space Space, User User, CurrentUser CurrentUser);
}