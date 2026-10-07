using System.Collections.Concurrent;
using System.Net;
using Kijk.Application.Shared.Identity;
using Kijk.Domain.Catalogs;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Kijk.IntegrationTests.Http;

// "Delete everything of me" runs as a durable job and keeps what other members still need.
[NotInParallel]
public class AccountDeletionHttpTests
{
    private static readonly Guid GroceriesId = SystemCategories.All.Single(category => category.Name == "Groceries").Id;
    private static readonly DateTime October = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task DeletingAnAccountRemovesOwnDataAndHandsSharedDataToTheRemainingMember()
    {
        var seed = await SeedAsync();
        var identities = new RecordingIdentityProvider();
        await using var host = await SpaceApiHost.StartAsync(
            seed.Leaving.AuthId,
            jobsEnabled: true,
            services => services.Replace(ServiceDescriptor.Singleton<IIdentityProvider>(identities)));

        using var response = await host.Client.PostAsync("/api/users/me/deletion", null);
        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        await WaitUntilDeletedAsync(seed.Leaving.Id);

        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        // Everything that belonged only to the leaving user is gone, including the space they used alone.
        await Assert.That(await dbContext.Spaces.AnyAsync(item => item.Id == seed.PersonalSpaceId || item.Id == seed.SoloSpaceId)).IsFalse();
        await Assert.That(await dbContext.Accounts.AnyAsync(item => item.Id == seed.PrivateAccountId)).IsFalse();
        await Assert.That(await dbContext.Transactions.AnyAsync(item => item.Counterparty == "Private shop")).IsFalse();
        await Assert.That(await dbContext.Budgets.AnyAsync(item => item.OwnerId != null)).IsFalse();
        await Assert.That(await dbContext.Units.AnyAsync(item => item.Id == seed.UnitId)).IsFalse();

        // Shared data stays and now belongs to the remaining member, who became the space's administrator.
        var shared = await dbContext.Transactions.SingleAsync(item => item.Counterparty == "Shared shop");
        var budget = await dbContext.Budgets.SingleAsync(item => item.SpaceId == seed.SharedSpaceId);
        var remaining = await dbContext.UserSpaces.Include(link => link.Role).SingleAsync(link => link.SpaceId == seed.SharedSpaceId);
        await Assert.That(shared.CreatedById).IsEqualTo(seed.Remaining.Id);
        await Assert.That(budget.CreatedById).IsEqualTo(seed.Remaining.Id);
        await Assert.That(remaining.UserId).IsEqualTo(seed.Remaining.Id);
        await Assert.That(remaining.Role.Name).IsEqualTo("Admin");
        await Assert.That(identities.Deleted).Contains(seed.Leaving.AuthId);
    }

    private static async Task WaitUntilDeletedAsync(Guid userId)
    {
        for (var attempt = 0; attempt < 120; attempt++)
        {
            await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
            if (!await dbContext.Users.AnyAsync(item => item.Id == userId))
            {
                return;
            }

            await Task.Delay(250);
        }

        throw new TimeoutException("The account was not deleted");
    }

    private static async Task<Seed> SeedAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var admin = await dbContext.Roles.SingleAsync(item => item.Name == "Admin");
        var member = await dbContext.Roles.SingleAsync(item => item.Name == "Member");
        var groceries = await dbContext.Categories.SingleAsync(item => item.Id == GroceriesId);
        var leaving = CreateUser("leaving");
        var remaining = CreateUser("remaining");

        var personal = Space.CreatePersonal();
        var solo = Space.Create("Solo");
        var shared = Space.Create("Shared");
        leaving.UserSpaces.Add(UserSpace.Create(leaving, personal, admin));
        leaving.UserSpaces.Add(UserSpace.Create(leaving, solo, admin));
        leaving.UserSpaces.Add(UserSpace.Create(leaving, shared, admin, isActive: true));
        remaining.UserSpaces.Add(UserSpace.Create(remaining, shared, member, isActive: true));
        dbContext.AddRange(leaving, remaining);
        // The private account only knows its owner's id, so the users must exist first.
        await dbContext.SaveChangesAsync();

        // A budget on an own category in the solo space: deleting it must not trip over restricting keys.
        var soloCategory = Category.Create("Hobby", "palette", "#123456", CategoryKind.Expense, solo);
        var soloBudget = Budget.Create(50m, new MonthYear(October), true, soloCategory, leaving, solo);

        var sharedAccount = Account.Create("Joint", null, shared);
        var privateAccount = Account.Create("Mine", null, shared);
        privateAccount.SetOwner(leaving.Id);
        var sharedBooking = Transaction.Create(new TransactionDetails(October, -10m, "Shared shop", null, TransactionStatus.Booked, false), sharedAccount, leaving, shared);
        var privateBooking = Transaction.Create(new TransactionDetails(October, -20m, "Private shop", null, TransactionStatus.Booked, false), privateAccount, leaving, shared);
        var sharedBudget = Budget.Create(300m, new MonthYear(October), true, groceries, leaving, shared);
        var privateBudget = Budget.Create(100m, new MonthYear(October), true, groceries, leaving, shared, Visibility.Private);
        var unit = new Unit { Name = "Bucket", Symbol = "bucket", QuantityKey = "Custom:bucket", CreatorType = CreatorType.User, ConversionType = UnitConversionType.None, OwnerUser = leaving };

        dbContext.AddRange(soloCategory, soloBudget, sharedAccount, privateAccount, sharedBooking, privateBooking, sharedBudget, privateBudget, unit);
        await dbContext.SaveChangesAsync();
        return new Seed(leaving, remaining, personal.Id, solo.Id, shared.Id, privateAccount.Id, unit.Id);
    }

    private static User CreateUser(string name)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed record Seed(User Leaving, User Remaining, Guid PersonalSpaceId, Guid SoloSpaceId, Guid SharedSpaceId, Guid PrivateAccountId, Guid UnitId);

    private sealed class RecordingIdentityProvider : IIdentityProvider
    {
        private readonly ConcurrentBag<string> _deleted = [];

        public IReadOnlyCollection<string> Deleted => [.. _deleted];

        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            Task.FromResult(new ExternalIdentity(null, null, null, null));

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task DeleteAsync(string authId, CancellationToken cancellationToken)
        {
            _deleted.Add(authId);
            return Task.CompletedTask;
        }
    }
}