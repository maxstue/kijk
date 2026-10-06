using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Accounts.Create;
using Kijk.Application.Accounts.Shared;
using Kijk.Application.Budgets.Create;
using Kijk.Application.Budgets.Shared;
using Kijk.Application.Budgets.Update;
using Kijk.Application.CategoryRules.Shared;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.Create;
using Kijk.Application.Transactions.Shared;
using Kijk.Application.Users.SwitchSpace;
using Kijk.Application.Users.Welcome;
using Kijk.Domain.Catalogs;
using Kijk.Domain.Entities;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Kijk.IntegrationTests.Http;

// Personal spaces and private accounts and budgets within a shared space.
[NotInParallel]
public class SpaceHttpTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private static readonly Guid GroceriesId = SystemCategories.All.Single(category => category.Name == "Groceries").Id;
    private static readonly DateOnly October = new(2026, 10, 1);

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task OnboardingCreatesAPersonalSpaceThatCanBeSwitchedToButNotDeleted()
    {
        await using var host = await SpaceApiHost.StartAsync(
            "newcomer-auth",
            configureServices: services => services.Replace(ServiceDescriptor.Scoped<IIdentityProvider, FakeIdentityProvider>()));

        using var welcomed = await host.Client.PutAsJsonAsync("/api/users/onboarding", new WelcomeUserRequest("Newcomer", "Family", false, false, AnalyticsConsent.Declined), Json);
        await Assert.That(welcomed.StatusCode).IsEqualTo(HttpStatusCode.OK);

        Guid personalId;
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var memberships = await dbContext.UserSpaces.Include(link => link.Space).ThenInclude(space => space.Accounts)
                .Where(link => link.User.AuthId == "newcomer-auth").ToListAsync();
            await Assert.That(memberships.Count).IsEqualTo(2);
            var personal = memberships.Single(link => link.Space.IsPersonal);
            await Assert.That(personal.IsActive).IsFalse();
            await Assert.That(personal.Space.Accounts.Single().Kind).IsEqualTo(AccountKind.Cash);
            await Assert.That(memberships.Single(link => !link.Space.IsPersonal).Space.Name).IsEqualTo("Family");
            personalId = personal.SpaceId;
        }

        using var switched = await host.Client.PutAsJsonAsync("/api/users/active-space", new SwitchSpaceRequest(personalId), Json);
        using var foreign = await host.Client.PutAsJsonAsync("/api/users/active-space", new SwitchSpaceRequest(Guid.NewGuid()), Json);
        using var deleted = await host.Client.DeleteAsync($"/api/spaces/{personalId}");

        await Assert.That(switched.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(foreign.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(deleted.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var active = await verification.UserSpaces.SingleAsync(link => link.User.AuthId == "newcomer-auth" && link.IsActive);
        await Assert.That(active.SpaceId).IsEqualTo(personalId);
    }

    [Test]
    public async Task PrivateAccountsAndTheirTransactionsAreOnlyVisibleToTheirOwner()
    {
        var (admin, member) = await CreateSharedSpaceAsync();
        await using var host = await SpaceApiHost.StartAsync(member.AuthId);
        using var adminClient = host.CreateClient(admin.AuthId);

        // A member may keep a private account without finances:configure, but cannot add a shared one.
        using var shared = await host.Client.PostAsJsonAsync("/api/accounts", new CreateAccountRequest("Joint", null), Json);
        using var created = await host.Client.PostAsJsonAsync("/api/accounts", new CreateAccountRequest("Mine", "1234", Visibility.Private), Json);
        await Assert.That(shared.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
        await Assert.That(created.StatusCode).IsEqualTo(HttpStatusCode.OK);
        var account = (await created.Content.ReadFromJsonAsync<AccountResponse>(Json))!;
        await Assert.That(account.Visibility).IsEqualTo(Visibility.Private);

        using var recorded = await host.Client.PostAsJsonAsync("/api/transactions",
            new CreateTransactionRequest(new DateOnly(2026, 10, 3), -20m, "Secret shop", null, TransactionStatus.Booked, false, account.Id, GroceriesId), Json);
        var transaction = (await recorded.Content.ReadFromJsonAsync<TransactionResponse>(Json))!;

        var ownAccounts = (await host.Client.GetFromJsonAsync<List<AccountResponse>>("/api/accounts", Json))!;
        var ownTransactions = (await host.Client.GetFromJsonAsync<List<TransactionResponse>>("/api/transactions?year=2026&month=10", Json))!;
        var ownOverview = (await host.Client.GetFromJsonAsync<BudgetOverviewResponse>("/api/budgets/overview?year=2026&month=10", Json))!;
        await Assert.That(ownAccounts.Select(item => item.Name)).Contains("Mine");
        await Assert.That(ownTransactions.Single().Id).IsEqualTo(transaction.Id);
        await Assert.That(ownOverview.TotalSpent).IsEqualTo(20m);

        var accounts = (await adminClient.GetFromJsonAsync<List<AccountResponse>>("/api/accounts", Json))!;
        var transactions = (await adminClient.GetFromJsonAsync<List<TransactionResponse>>("/api/transactions?year=2026&month=10", Json))!;
        var overview = (await adminClient.GetFromJsonAsync<BudgetOverviewResponse>("/api/budgets/overview?year=2026&month=10", Json))!;
        var export = await adminClient.GetStringAsync("/api/transactions/export");
        using var single = await adminClient.GetAsync($"/api/transactions/{transaction.Id}");
        using var deleteAccount = await adminClient.DeleteAsync($"/api/accounts/{account.Id}");

        await Assert.That(accounts.Select(item => item.Name)).DoesNotContain("Mine");
        await Assert.That(transactions).IsEmpty();
        await Assert.That(overview.TotalSpent).IsEqualTo(0m);
        await Assert.That(export).DoesNotContain("Secret shop");
        await Assert.That(single.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(deleteAccount.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task PrivateBudgetsReplaceTheSharedBudgetForTheirOwnerOnly()
    {
        var (admin, member) = await CreateSharedSpaceAsync();
        await using var host = await SpaceApiHost.StartAsync(member.AuthId);
        using var adminClient = host.CreateClient(admin.AuthId);

        using var sharedBudget = await adminClient.PostAsJsonAsync("/api/budgets", new CreateBudgetRequest(GroceriesId, 300m, October, true), Json);
        using var memberShared = await host.Client.PostAsJsonAsync("/api/budgets", new CreateBudgetRequest(GroceriesId, 50m, October, true), Json);
        using var privateBudget = await host.Client.PostAsJsonAsync("/api/budgets", new CreateBudgetRequest(GroceriesId, 100m, October, true, Visibility.Private), Json);
        await Assert.That(sharedBudget.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(memberShared.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
        await Assert.That(privateBudget.StatusCode).IsEqualTo(HttpStatusCode.OK);
        var created = (await privateBudget.Content.ReadFromJsonAsync<BudgetResponse>(Json))!;

        var memberOverview = (await host.Client.GetFromJsonAsync<BudgetOverviewResponse>("/api/budgets/overview?year=2026&month=10", Json))!;
        var adminOverview = (await adminClient.GetFromJsonAsync<BudgetOverviewResponse>("/api/budgets/overview?year=2026&month=10", Json))!;
        using var foreignUpdate = await adminClient.PutAsJsonAsync($"/api/budgets/{created.Id}", new UpdateBudgetRequest(1m, true), Json);

        var memberGroceries = memberOverview.Categories.Single(item => item.CategoryId == GroceriesId);
        var adminGroceries = adminOverview.Categories.Single(item => item.CategoryId == GroceriesId);
        await Assert.That(memberGroceries.Budget).IsEqualTo(100m);
        await Assert.That(memberGroceries.BudgetVisibility).IsEqualTo(Visibility.Private);
        await Assert.That(adminGroceries.Budget).IsEqualTo(300m);
        await Assert.That(adminGroceries.BudgetVisibility).IsEqualTo(Visibility.Shared);
        await Assert.That(foreignUpdate.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task RulesRememberedFromPrivateAccountsStayPrivate()
    {
        var (admin, member) = await CreateSharedSpaceAsync();
        Guid privateBooking;
        Guid sharedBooking;
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var space = await dbContext.Spaces.SingleAsync(item => item.Name == "Shared space");
            var memberUser = await dbContext.Users.SingleAsync(item => item.Id == member.Id);
            var privateAccount = Account.Create("Mine", null, space);
            privateAccount.SetOwner(member.Id);
            var sharedAccount = Account.Create("Joint", null, space);
            var job = ImportJob.Create("export.csv", sharedAccount, memberUser, space);
            var mine = Booking(privateAccount, "Secret Shop", "private-1");
            var joint = Booking(sharedAccount, "Secret Shop", "shared-1");
            dbContext.AddRange(privateAccount, sharedAccount, job, mine, joint);
            await dbContext.SaveChangesAsync();
            (privateBooking, sharedBooking) = (mine.Id, joint.Id);

            Transaction Booking(Account account, string counterparty, string key) => Transaction.CreateImported(
                new TransactionDetails(new DateTime(2026, 10, 4, 0, 0, 0, DateTimeKind.Utc), -9m, counterparty, null, TransactionStatus.Booked, false),
                new TransactionKeys(key, null, 1, true),
                account,
                job,
                memberUser,
                space);
        }

        await using var host = await SpaceApiHost.StartAsync(member.AuthId);
        using var adminClient = host.CreateClient(admin.AuthId);

        using var remembered = await host.Client.PutAsJsonAsync($"/api/transactions/{privateBooking}/category", new CategorizeTransactionRequest(GroceriesId, true), Json);
        var result = (await remembered.Content.ReadFromJsonAsync<CategorizeTransactionResponse>(Json))!;
        var ownRules = (await host.Client.GetFromJsonAsync<List<CategoryRuleResponse>>("/api/category-rules", Json))!;
        var adminRules = (await adminClient.GetFromJsonAsync<List<CategoryRuleResponse>>("/api/category-rules", Json))!;

        await Assert.That(result.AppliedToOthers).IsEqualTo(0);
        await Assert.That(ownRules.Single().Visibility).IsEqualTo(Visibility.Private);
        await Assert.That(adminRules).IsEmpty();
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That((await verification.Transactions.SingleAsync(item => item.Id == sharedBooking)).CategoryId).IsNull();

        // Remembering from the shared account creates a shared rule next to the private one.
        using var shared = await host.Client.PutAsJsonAsync($"/api/transactions/{sharedBooking}/category", new CategorizeTransactionRequest(GroceriesId, true), Json);
        var adminRulesAfter = (await adminClient.GetFromJsonAsync<List<CategoryRuleResponse>>("/api/category-rules", Json))!;
        await Assert.That(adminRulesAfter.Single().Visibility).IsEqualTo(Visibility.Shared);
    }

    private static async Task<(User Admin, User Member)> CreateSharedSpaceAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Shared space");
        var adminRole = await dbContext.Roles.SingleAsync(item => item.Name == "Admin");
        var memberRole = await dbContext.Roles.SingleAsync(item => item.Name == "Member");
        var admin = CreateUser("space-admin");
        var member = CreateUser("space-member");
        admin.UserSpaces.Add(UserSpace.Create(admin, space, adminRole, isActive: true));
        member.UserSpaces.Add(UserSpace.Create(member, space, memberRole, isActive: true));
        dbContext.AddRange(admin, member);
        await dbContext.SaveChangesAsync();
        return (admin, member);
    }

    private static User CreateUser(string name)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed class FakeIdentityProvider : IIdentityProvider
    {
        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            Task.FromResult(new ExternalIdentity("Newcomer", "newcomer@example.test", null, false));

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task DeleteAsync(string authId, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}