using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.CategoryRules.Suggestions;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Transactions.Categorize;
using Kijk.Domain.Catalogs;
using Kijk.Domain.Entities;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;

namespace Kijk.IntegrationTests.Http;

// Repeated manual corrections turn into rule suggestions, so recurring bookings get categorized without the AI.
[NotInParallel]
public class RuleSuggestionHttpTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private static readonly Guid GroceriesId = SystemCategories.All.Single(category => category.Name == "Groceries").Id;
    private static readonly Guid HousingId = SystemCategories.All.Single(category => category.Name == "Housing").Id;
    private static readonly string[] BeforeRemembering = ["REWE Markt", "Stadtwerke"];
    private static readonly string[] AfterRemembering = ["Stadtwerke"];
    private static readonly Guid LeisureId = SystemCategories.All.Single(category => category.Name == "Leisure").Id;

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task RepeatedCorrectionsAreSuggestedAndRememberingCategorizesTheRest()
    {
        var user = await SeedAsync();
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        var suggestions = (await host.Client.GetFromJsonAsync<List<CategoryRuleSuggestionResponse>>("/api/category-rules/suggestions", Json))!;

        // REWE twice by hand plus one open booking; the utility once by hand plus one open booking.
        await Assert.That(suggestions.Select(item => item.Label)).IsEquivalentTo(BeforeRemembering);
        var rewe = suggestions.Single(item => item.Label == "REWE Markt");
        await Assert.That(rewe.Scope).IsEqualTo(CategoryRuleScope.Merchant);
        await Assert.That(rewe.CategoryId).IsEqualTo(GroceriesId);
        await Assert.That(rewe.ManualCount).IsEqualTo(2);
        await Assert.That(rewe.UncategorizedCount).IsEqualTo(1);
        await Assert.That(suggestions.Single(item => item.Label == "Stadtwerke").Scope).IsEqualTo(CategoryRuleScope.Counterparty);

        using var remembered = await host.Client.PutAsJsonAsync($"/api/transactions/{rewe.TransactionId}/category", new CategorizeTransactionRequest(rewe.CategoryId, true), Json);
        var result = (await remembered.Content.ReadFromJsonAsync<CategorizeTransactionResponse>(Json))!;
        var after = (await host.Client.GetFromJsonAsync<List<CategoryRuleSuggestionResponse>>("/api/category-rules/suggestions", Json))!;

        await Assert.That(result.AppliedToOthers).IsEqualTo(1);
        await Assert.That(after.Select(item => item.Label)).IsEquivalentTo(AfterRemembering);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var open = await verification.Transactions.SingleAsync(item => item.Counterparty == "REWE Markt" && item.CategorySource == CategorySource.Rule);
        await Assert.That(open.CategoryId).IsEqualTo(GroceriesId);
    }

    private static async Task<User> SeedAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Suggestions");
        var role = await dbContext.Roles.SingleAsync(item => item.Name == "Member");
        var user = User.Init("suggestion-auth", "suggestion", "suggestion@example.test");
        user.CompleteOnboarding("suggestion", AnalyticsConsent.Declined, DateTime.UtcNow);
        user.UserSpaces.Add(UserSpace.Create(user, space, role, isActive: true));
        var account = Account.Create("Giro", "1234", space);
        var job = ImportJob.Create("export.csv", account, user, space);
        var categories = await dbContext.Categories.Where(item => item.CreatorType == CreatorType.System).ToDictionaryAsync(item => item.Id);
        var day = 0;

        Transaction Booking(string counterparty, string? counterpartyKey, bool merchant, Guid? categoryId)
        {
            day++;
            var transaction = Transaction.CreateImported(
                new TransactionDetails(new DateTime(2026, 10, day, 0, 0, 0, DateTimeKind.Utc), -10m, counterparty, null, TransactionStatus.Booked, false),
                new TransactionKeys($"booking-{day}", counterpartyKey, 1, merchant),
                account,
                job,
                user,
                space);
            if (categoryId is { } id)
            {
                transaction.AssignCategoryManually(categories[id]);
            }

            return transaction;
        }

        dbContext.AddRange(
            user,
            account,
            job,
            Booking("REWE Markt", null, true, GroceriesId),
            Booking("REWE Markt", null, true, GroceriesId),
            Booking("REWE Markt", null, true, null),
            // Conflicting corrections: no suggestion.
            Booking("Kino am Markt", null, true, LeisureId),
            Booking("Kino am Markt", null, true, GroceriesId),
            Booking("Stadtwerke", "counterparty-key", false, HousingId),
            Booking("Stadtwerke", "counterparty-key", false, null),
            // A remembered merchant is not suggested again.
            Booking("ALDI Süd", null, true, GroceriesId),
            Booking("ALDI Süd", null, true, GroceriesId),
            // A transfer without IBAN is never matched by name.
            Booking("Max Mustermann", null, false, HousingId),
            Booking("Max Mustermann", null, false, HousingId));
        var aldi = CategoryRuleKeys.For(null, "ALDI Süd", isMerchantPayment: true)!.Value;
        dbContext.Add(CategoryRule.CreateFromCorrection(aldi.Scope, aldi.Key, "ALDI Süd", categories[GroceriesId], space.Id));
        await dbContext.SaveChangesAsync();
        return user;
    }
}