using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;

namespace Kijk.UnitTests.Domain;

public class BudgetCalculatorTests
{
    private static readonly MonthYear October = new(new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));
    private readonly Household _household = Household.Create("Test household");
    private readonly User _user = User.Init("auth", "Test", "test@example.test");
    private readonly Category _groceries;
    private readonly Category _leisure;
    private readonly Category _income;

    public BudgetCalculatorTests()
    {
        _groceries = CreateCategory("Groceries", CategoryKind.Expense);
        _leisure = CreateCategory("Leisure", CategoryKind.Expense);
        _income = CreateCategory("Income", CategoryKind.Income);
    }

    [Test]
    public async Task ExpensesUseUpTheBudgetOfTheirCategory()
    {
        var budget = CreateBudget(_groceries, 400m, October);

        var summary = Calculate([budget], [Book(-120.50m, _groceries), Book(-79.50m, _groceries)]);

        var groceries = summary.Categories.Single(item => item.Category == _groceries);
        await Assert.That(groceries.Spent).IsEqualTo(200m);
        await Assert.That(groceries.Remaining).IsEqualTo(200m);
        await Assert.That(groceries.UtilizationPercentage).IsEqualTo(50m);
        await Assert.That(groceries.IsExceeded).IsFalse();
        await Assert.That(summary.TotalBudget).IsEqualTo(400m);
    }

    [Test]
    public async Task SpendingOverTheBudgetIsExceeded()
    {
        var summary = Calculate([CreateBudget(_leisure, 50m, October)], [Book(-50.01m, _leisure)]);

        await Assert.That(summary.Categories.Single().IsExceeded).IsTrue();
    }

    [Test]
    public async Task RefundsLowerTheSpendingInTheirBookingMonth()
    {
        var summary = Calculate([CreateBudget(_groceries, 100m, October)], [Book(-80m, _groceries), Book(30m, _groceries)]);

        await Assert.That(summary.Categories.Single().Spent).IsEqualTo(50m);
        await Assert.That(summary.TotalSpent).IsEqualTo(50m);
    }

    [Test]
    public async Task IncomeIsEvaluatedSeparately()
    {
        var summary = Calculate([], [Book(2500m, _income), Book(-20m, _groceries)]);

        await Assert.That(summary.Income).IsEqualTo(2500m);
        await Assert.That(summary.TotalSpent).IsEqualTo(20m);
        await Assert.That(summary.Categories.Any(item => item.Category == _income)).IsFalse();
    }

    [Test]
    public async Task TransfersNeverCount()
    {
        var transfer = Book(-500m, _groceries);
        transfer.IsTransfer = true;

        var summary = Calculate([CreateBudget(_groceries, 100m, October)], [transfer]);

        await Assert.That(summary.Categories.Single().Spent).IsEqualTo(0m);
        await Assert.That(summary.TotalSpent).IsEqualTo(0m);
    }

    [Test]
    public async Task PendingExpensesAreReportedSeparatelyAndDoNotCount()
    {
        var pending = Book(-40m, _groceries);
        pending.Status = TransactionStatus.Pending;

        var summary = Calculate([CreateBudget(_groceries, 100m, October)], [pending, Book(-10m, _groceries)]);

        var groceries = summary.Categories.Single();
        await Assert.That(groceries.Spent).IsEqualTo(10m);
        await Assert.That(groceries.Pending).IsEqualTo(40m);
        await Assert.That(summary.PendingExpenses).IsEqualTo(40m);
    }

    [Test]
    public async Task UncategorizedTransactionsAreReportedSeparately()
    {
        var summary = Calculate([], [Book(-15m, null), Book(5m, null)]);

        await Assert.That(summary.UncategorizedExpenses).IsEqualTo(15m);
        await Assert.That(summary.UncategorizedIncome).IsEqualTo(5m);
        await Assert.That(summary.TotalSpent).IsEqualTo(15m);
        await Assert.That(summary.Categories).IsEmpty();
    }

    [Test]
    public async Task TransactionsOutsideTheMonthAreIgnored()
    {
        var september = Book(-99m, _groceries);
        september.BookingDate = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc);

        var summary = Calculate([], [september]);

        await Assert.That(summary.TotalSpent).IsEqualTo(0m);
    }

    [Test]
    public async Task LatestBudgetStartingInOrBeforeTheMonthApplies()
    {
        var august = new MonthYear(new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc));
        var september = new MonthYear(new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc));
        var november = new MonthYear(new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc));

        var summary = Calculate(
            [CreateBudget(_groceries, 300m, august), CreateBudget(_groceries, 350m, september), CreateBudget(_groceries, 500m, november)],
            []);

        await Assert.That(summary.Categories.Single().Budget!.Amount).IsEqualTo(350m);
    }

    [Test]
    public async Task InactiveBudgetPausesTheTarget()
    {
        var budget = CreateBudget(_groceries, 100m, October);
        budget.Active = false;

        var summary = Calculate([budget], [Book(-150m, _groceries)]);

        var groceries = summary.Categories.Single();
        await Assert.That(groceries.Budget).IsNull();
        await Assert.That(groceries.IsExceeded).IsFalse();
        await Assert.That(summary.TotalBudget).IsEqualTo(0m);
    }

    private BudgetMonthSummary Calculate(IEnumerable<Budget> budgets, IEnumerable<Transaction> transactions) =>
        BudgetCalculator.Calculate(October, [_groceries, _leisure, _income], budgets, transactions);

    private Category CreateCategory(string name, CategoryKind kind)
    {
        var category = Category.Create(name, "circle", "#000000", kind, _household);
        category.Id = Guid.NewGuid();
        return category;
    }

    private Budget CreateBudget(Category category, decimal amount, MonthYear validFrom)
    {
        var budget = Budget.Create(amount, validFrom, true, category, _user, _household);
        budget.Id = Guid.NewGuid();
        budget.CategoryId = category.Id;
        return budget;
    }

    private Transaction Book(decimal amount, Category? category)
    {
        var transaction = Transaction.Create(
            new TransactionDetails(new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc), amount, "Shop", null, TransactionStatus.Booked, false),
            null,
            _user,
            _household);
        transaction.AssignCategoryManually(category);
        return transaction;
    }
}