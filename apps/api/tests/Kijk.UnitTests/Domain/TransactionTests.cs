using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.UnitTests.Domain;

public class TransactionTests
{
    private readonly Space _space = Space.Create("Test space");

    [Test]
    public async Task AutomaticCategorizationNeverOverwritesAManualCategory()
    {
        var transaction = CreateTransaction();
        var manual = CreateCategory("Leisure");
        transaction.AssignCategoryManually(manual);

        var applied = transaction.AssignCategoryAutomatically(CreateCategory("Groceries"), CategorySource.Ai);

        await Assert.That(applied).IsFalse();
        await Assert.That(transaction.CategoryId).IsEqualTo(manual.Id);
        await Assert.That(transaction.CategorySource).IsEqualTo(CategorySource.Manual);
    }

    [Test]
    public async Task AutomaticCategorizationReplacesAnotherAutomaticCategory()
    {
        var transaction = CreateTransaction();
        transaction.AssignCategoryAutomatically(CreateCategory("Leisure"), CategorySource.Rule);
        var groceries = CreateCategory("Groceries");

        var applied = transaction.AssignCategoryAutomatically(groceries, CategorySource.Ai);

        await Assert.That(applied).IsTrue();
        await Assert.That(transaction.CategoryId).IsEqualTo(groceries.Id);
        await Assert.That(transaction.CategorySource).IsEqualTo(CategorySource.Ai);
    }

    [Test]
    public async Task ClearingTheCategoryAlsoClearsItsSource()
    {
        var transaction = CreateTransaction();
        transaction.AssignCategoryManually(CreateCategory("Leisure"));

        transaction.AssignCategoryManually(null);

        await Assert.That(transaction.CategoryId).IsNull();
        await Assert.That(transaction.CategorySource).IsNull();
    }

    private Transaction CreateTransaction() =>
        Transaction.Create(
            new TransactionDetails(new DateTime(2026, 10, 15, 13, 45, 0, DateTimeKind.Utc), -12.5m, "Shop", null, TransactionStatus.Booked, false),
            null,
            User.Init("auth", "Test", "test@example.test"),
            _space);

    private Category CreateCategory(string name)
    {
        var category = Category.Create(name, "circle", "#000000", CategoryKind.Expense, _space);
        category.Id = Guid.NewGuid();
        return category;
    }
}