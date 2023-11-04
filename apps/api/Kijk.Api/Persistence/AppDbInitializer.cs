using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Persistence;

public static class AppDbInitializer
{
    private static readonly List<Category> DefaultCategories = new()
    {
        Category.Create("Income", "#232e4b"),
        Category.Create("Other Income", "#232e4b"),
        Category.Create("Cash", "#325e33"),
        Category.Create("Insurance", "#795c5e"),
        Category.Create("Vacation", "#e36d4f"),
        Category.Create("Food", "#e6b84b"),
        Category.Create("Shopping", "#66d2d8"),
        Category.Create("Transportation", "#7d10a4"),
        Category.Create("Mobility", "#e222e6"),
        Category.Create("Living", "#232e4b"),
        Category.Create("Other Expense", "#496b83"),
        Category.Create("Pets", "#6a7456"),
        Category.Create("Children", "#c046ea"),
        Category.Create("Entertainment", "#232e4b"),
        Category.Create("Subscription", "#BA93F8"),
        Category.Create("Education", "#da3e48"),
    };

    public static async Task InitDb(AppDbContext dbContext, IWebHostEnvironment environment)
    {
        try
        {
            if (environment.IsDevelopment())
            {
                await dbContext.Database.MigrateAsync();
                Log.ForContext(typeof(AppDbInitializer)).Information("Database exists and is up to date");
            }

            await CreateDefaultCategories(dbContext);
        }
        catch (Exception e)
        {
            Log.ForContext(typeof(AppDbInitializer)).Error("Database initialization error {E}", e.Message);
            throw;
        }
    }

    private static async Task CreateDefaultCategories(AppDbContext dbContext)
    {
        foreach (var defaultCategory in DefaultCategories)
        {
            AddCategory(dbContext, defaultCategory);
        }

        await dbContext.SaveChangesAsync();
        Log.ForContext(typeof(AppDbInitializer)).Information("Created default categories");
    }

    // since we run this seeder when the app starts
    // we should avoid adding duplicates, so check first then add
    private static void AddCategory(AppDbContext dbContext, Category defaultCategory)
    {
        var existingType = dbContext.Categories.FirstOrDefault(p => p.Name == defaultCategory.Name);
        if (existingType is null)
        {
            dbContext.Categories.Add(defaultCategory);
            Log.ForContext(typeof(AppDbInitializer)).Debug("Created category with name: '{Name}' ", defaultCategory.Name);
        }
    }
}
