using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Accounts.Create;
using Kijk.Application.Budgets.Create;
using Kijk.Application.Budgets.Shared;
using Kijk.Application.Budgets.Statistics;
using Kijk.Application.Categories.Create;
using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.Create;
using Kijk.Application.Transactions.Shared;
using Kijk.Application.Transactions.Update;
using Kijk.Domain.Authorization;
using Kijk.Domain.Catalogs;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;

namespace Kijk.IntegrationTests.Http;

[NotInParallel]
public class FinancePermissionHttpTests
{
    private static readonly Guid GroceriesId = SystemCategories.All.Single(category => category.Name == "Groceries").Id;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private static readonly decimal[] OctoberSpending = [0m, 0m, 42.5m, 0m];
    private static readonly Guid IncomeId = SystemCategories.All.Single(category => category.Name == "Income").Id;

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    [Arguments("Admin")]
    [Arguments("Member")]
    [Arguments("Viewer")]
    public async Task EveryRoleCanReadFinanceData(string role)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);

        foreach (var path in new[] { "/api/categories", "/api/accounts", "/api/budgets", "/api/budgets/overview?year=2026&month=10", "/api/transactions?year=2026&month=10", $"/api/transactions/{fixture.Transaction.Id}" })
        {
            using var response = await host.Client.GetAsync(path);
            if (response.StatusCode != HttpStatusCode.OK)
            {
                throw new InvalidOperationException($"{path}: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
            }
            await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        }
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.Created)]
    [Arguments("Member", HttpStatusCode.Created)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task RecordingTransactionsRequiresRecordPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PostAsJsonAsync("/api/transactions",
            new CreateTransactionRequest(new DateOnly(2026, 10, 2), -9.99m, "Bakery", null, TransactionStatus.Booked, false, fixture.Account.Id, GroceriesId));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Transactions.CountAsync()).IsEqualTo(expected == HttpStatusCode.Created ? 2 : 1);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task PlanningBudgetsRequiresPlanPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PostAsJsonAsync("/api/budgets", new CreateBudgetRequest(GroceriesId, 400m, new DateOnly(2026, 11, 15), true));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task ConfiguringCategoriesAndAccountsRequiresConfigurePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var category = await host.Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Gifts", "gift", "#aa7744", CategoryKind.Expense));
        using var account = await host.Client.PostAsJsonAsync("/api/accounts", new CreateAccountRequest("Savings", "9876"));

        await Assert.That(category.StatusCode).IsEqualTo(expected);
        await Assert.That(account.StatusCode).IsEqualTo(expected);
    }

    [Test]
    public async Task SystemCategoriesCannotBeChanged()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.DeleteAsync($"/api/categories/{GroceriesId}");

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task BudgetsCanOnlyBeSetForExpenseCategories()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PostAsJsonAsync("/api/budgets", new CreateBudgetRequest(IncomeId, 100m, new DateOnly(2026, 10, 1), true));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task OverviewEvaluatesTheBudgetOfTheMonth()
    {
        var fixture = await CreateFixtureAsync("Viewer");
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);

        var overview = await host.Client.GetFromJsonAsync<BudgetOverviewResponse>("/api/budgets/overview?year=2026&month=10", Json);

        var groceries = overview!.Categories.Single(item => item.CategoryId == GroceriesId);
        await Assert.That(groceries.Budget).IsEqualTo(300m);
        await Assert.That(groceries.Spent).IsEqualTo(42.5m);
        await Assert.That(groceries.Remaining).IsEqualTo(257.5m);
    }

    [Test]
    public async Task ChangingTheCategoryMarksItAsManual()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        var leisureId = SystemCategories.All.Single(category => category.Name == "Leisure").Id;

        using var response = await host.Client.PutAsJsonAsync($"/api/transactions/{fixture.Transaction.Id}",
            new UpdateTransactionRequest(new DateOnly(2026, 10, 5), -42.5m, "Supermarket", null, TransactionStatus.Booked, false, fixture.Account.Id, leisureId));
        var updated = await response.Content.ReadFromJsonAsync<TransactionResponse>(Json);

        await Assert.That(updated!.CategoryId).IsEqualTo(leisureId);
        await Assert.That(updated.CategorySource).IsEqualTo(CategorySource.Manual);
    }

    [Test]
    public async Task SeveralTransactionsCanBeCategorizedAtOnceWithinTheHouseholdOnly()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var account = await dbContext.Accounts.Include(item => item.Household).SingleAsync(item => item.Id == fixture.Account.Id);
            var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
            dbContext.AddRange(
                Transaction.Create(new TransactionDetails(new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc), -5m, "Old shop", null, TransactionStatus.Booked, false), account, user, account.Household),
                Transaction.Create(new TransactionDetails(new DateTime(2026, 10, 9, 0, 0, 0, DateTimeKind.Utc), -7m, "New shop", null, TransactionStatus.Booked, false), account, user, account.Household));
            await dbContext.SaveChangesAsync();
        }

        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        // Without a period the list holds uncategorized transactions of all months.
        var open = (await host.Client.GetFromJsonAsync<List<TransactionResponse>>("/api/transactions?uncategorized=true", Json))!;
        await Assert.That(open.Count).IsEqualTo(2);

        using var assigned = await host.Client.PutAsJsonAsync("/api/transactions/category", new CategorizeTransactionsRequest([.. open.Select(item => item.Id)], GroceriesId), Json);
        var result = await assigned.Content.ReadFromJsonAsync<CategorizeTransactionsResponse>(Json);
        await Assert.That(result!.Updated).IsEqualTo(2);
        var remaining = (await host.Client.GetFromJsonAsync<List<TransactionResponse>>("/api/transactions?uncategorized=true", Json))!;
        await Assert.That(remaining).IsEmpty();

        var outsider = await CreateOutsiderAsync();
        await using var outsiderHost = await HouseholdApiHost.StartAsync(outsider.AuthId);
        using var foreign = await outsiderHost.Client.PutAsJsonAsync("/api/transactions/category", new CategorizeTransactionsRequest([fixture.Transaction.Id], null), Json);
        await Assert.That(foreign.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.OK)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task ExportingTransactionsRequiresExportPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);

        using var response = await host.Client.GetAsync("/api/transactions/export?year=2026&month=10");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    public async Task ExportedTransactionsAreReadableAndCannotInjectFormulas()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var account = await dbContext.Accounts.Include(item => item.Household).SingleAsync(item => item.Id == fixture.Account.Id);
            var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
            dbContext.Add(Transaction.Create(
                new TransactionDetails(new DateTime(2026, 10, 7, 0, 0, 0, DateTimeKind.Utc), 19.99m, "=HYPERLINK(\"x\")", "Erstattung, Bäckerei", TransactionStatus.Booked, false),
                account, user, account.Household));
            await dbContext.SaveChangesAsync();
        }

        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.GetAsync("/api/transactions/export?year=2026&month=10");
        var bytes = await response.Content.ReadAsByteArrayAsync();
        var csv = System.Text.Encoding.UTF8.GetString(bytes);

        await Assert.That(response.Content.Headers.ContentDisposition!.FileName).Contains("transactions-2026-10.csv");
        await Assert.That(bytes.Take(3)).IsEquivalentTo(new byte[] { 0xEF, 0xBB, 0xBF });
        var lines = csv.TrimStart('\uFEFF').Split("\r\n", StringSplitOptions.RemoveEmptyEntries);
        await Assert.That(lines[0]).IsEqualTo("Date,Account,Counterparty,Purpose,Amount,Currency,Category,CategorySource,Status,IsTransfer");
        await Assert.That(lines[1]).IsEqualTo("2026-10-05,Checking,Supermarket,,-42.50,EUR,Groceries,Manual,Booked,false");
        await Assert.That(lines[2]).StartsWith("2026-10-07,Checking,\"'=HYPERLINK(\"\"x\"\")\",\"Erstattung, Bäckerei\",19.99,EUR,,");
    }

    [Test]
    public async Task StatisticsShowTheSpendingPerCategoryOverMonths()
    {
        var fixture = await CreateFixtureAsync("Viewer");
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);

        var statistics = (await host.Client.GetFromJsonAsync<BudgetStatisticsResponse>("/api/budgets/statistics?year=2026&month=11&months=4", Json))!;
        using var invalid = await host.Client.GetAsync("/api/budgets/statistics?year=2026&month=11&months=25");

        await Assert.That(statistics.Months).IsEquivalentTo(new[] { new DateOnly(2026, 8, 1), new DateOnly(2026, 9, 1), new DateOnly(2026, 10, 1), new DateOnly(2026, 11, 1) });
        var groceries = statistics.Categories.Single(item => item.CategoryId == GroceriesId);
        await Assert.That(groceries.Spent).IsEquivalentTo(OctoberSpending);
        // The budget applies from September on.
        await Assert.That(groceries.Budget).IsEquivalentTo(new decimal?[] { null, 300m, 300m, 300m });
        await Assert.That(statistics.TotalSpent).IsEquivalentTo(OctoberSpending);
        await Assert.That(invalid.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task HouseholdsCannotSeeOrUseEachOthersFinanceData()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var outsider = await CreateOutsiderAsync();
        await using var host = await HouseholdApiHost.StartAsync(outsider.AuthId);

        using var transaction = await host.Client.GetAsync($"/api/transactions/{fixture.Transaction.Id}");
        var transactions = await host.Client.GetFromJsonAsync<List<TransactionResponse>>("/api/transactions", Json);
        var overview = await host.Client.GetFromJsonAsync<BudgetOverviewResponse>("/api/budgets/overview?year=2026&month=10", Json);
        var budgets = await host.Client.GetFromJsonAsync<List<BudgetResponse>>("/api/budgets", Json);
        using var foreignAccount = await host.Client.PostAsJsonAsync("/api/transactions",
            new CreateTransactionRequest(new DateOnly(2026, 10, 2), -1m, null, null, TransactionStatus.Booked, false, fixture.Account.Id, null));
        using var foreignCategory = await host.Client.PostAsJsonAsync("/api/transactions",
            new CreateTransactionRequest(new DateOnly(2026, 10, 2), -1m, null, null, TransactionStatus.Booked, false, null, fixture.CustomCategory.Id));
        using var foreignBudget = await host.Client.DeleteAsync($"/api/budgets/{fixture.Budget.Id}");

        await Assert.That(transaction.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(transactions!).IsEmpty();
        await Assert.That(overview!.TotalSpent).IsEqualTo(0m);
        await Assert.That(budgets!).IsEmpty();
        await Assert.That(foreignAccount.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(foreignCategory.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(foreignBudget.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    private static async Task<Fixture> CreateFixtureAsync(string roleName)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = Household.Create("Shared household");
        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName);
        var user = CreateUser("actor");
        user.UserHouseholds.Add(UserHousehold.Create(user, household, role, isActive: true));
        var groceries = await dbContext.Categories.SingleAsync(item => item.Id == GroceriesId);
        var customCategory = Category.Create("Pets", "paw-print", "#aa7744", CategoryKind.Expense, household);
        var account = Account.Create("Checking", "1234", household);
        var budget = Budget.Create(300m, new MonthYear(new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)), true, groceries, user, household);
        var transaction = Transaction.Create(
            new TransactionDetails(new DateTime(2026, 10, 5, 0, 0, 0, DateTimeKind.Utc), -42.5m, "Supermarket", null, TransactionStatus.Booked, false),
            account, user, household);
        transaction.AssignCategoryManually(groceries);
        dbContext.AddRange(user, customCategory, account, budget, transaction);
        await dbContext.SaveChangesAsync();
        return new(user, account, customCategory, budget, transaction);
    }

    private static async Task<User> CreateOutsiderAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = Household.Create("Other household");
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == HouseholdRoles.Admin.Id);
        var user = CreateUser("outsider");
        user.UserHouseholds.Add(UserHousehold.Create(user, household, admin, isActive: true));
        dbContext.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static User CreateUser(string name)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed record Fixture(User User, Account Account, Category CustomCategory, Budget Budget, Transaction Transaction);
}