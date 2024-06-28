using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Persistence;

public static class AppDbInitializer
{
    private static readonly List<Category> DefaultCategories =
    [
        Category.Create("Income", "#232e4b", type: CategoryType.Income),
        Category.Create("Other Income", "#232e4b", type: CategoryType.Income),
        Category.Create("Cash", "#439145", type: CategoryType.Income),

        Category.Create("Cash", "#325e33", type: CategoryType.Expense),
        Category.Create("Insurance", "#795c5e", type: CategoryType.Expense),
        Category.Create("Vacation", "#e36d4f", type: CategoryType.Expense),
        Category.Create("Food", "#e6b84b", type: CategoryType.Expense),
        Category.Create("Shopping", "#66d2d8", type: CategoryType.Expense),
        Category.Create("Transportation", "#7d10a4", type: CategoryType.Expense),
        Category.Create("Mobility", "#e222e6", type: CategoryType.Expense),
        Category.Create("Living", "#232e4b", type: CategoryType.Expense),
        Category.Create("Other Expense", "#496b83", type: CategoryType.Expense),
        Category.Create("Pets", "#6a7456", type: CategoryType.Expense),
        Category.Create("Children", "#c046ea", type: CategoryType.Expense),
        Category.Create("Entertainment", "#232e4b", type: CategoryType.Expense),
        Category.Create("Subscription", "#BA93F8", type: CategoryType.Expense),
        Category.Create("Education", "#da3e48", type: CategoryType.Expense),
        Category.Create("Uncategorized", "#616161", type: CategoryType.Expense)
    ];

    public static void InitDb(AppDbContext dbContext)
    {
        try
        {
            // since we run this seeder when the app starts
            // we should avoid adding duplicates, so check first then add
            foreach (var defaultCategory in DefaultCategories)
            {
                var existingType = dbContext.Categories.FirstOrDefault(p => p.Name == defaultCategory.Name);
                if (existingType is null)
                {
                    dbContext.Categories.Add(defaultCategory);
                    Log.ForContext(typeof(AppDbInitializer)).Debug("Created category with name: '{Name}' ", defaultCategory.Name);
                }
            }

            dbContext.SaveChanges();
            Log.ForContext(typeof(AppDbInitializer)).Information("Default ‘categories' initialized");
        }
        catch (Exception e)
        {
            Log.ForContext(typeof(AppDbInitializer)).Error("Initializing default ‘categories' failed with error {E}", e.Message);
            throw;
        }
    }
}
