using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Persistence;

public static class AppDbInitializer
{
    private static readonly List<Category> DefaultCategories = new()
    {
        new Category { Name = "Income", Color = "#232e4b" },
        new Category { Name = "Other Income", Color = "#232e4b" },
        new Category { Name = "Cash", Color = "#325e33" },
        new Category { Name = "Insurance", Color = "#795c5e" },
        new Category { Name = "Vacation", Color = "#e36d4f" },
        new Category { Name = "Food", Color = "#e6b84b" },
        new Category { Name = "Insurance", Color = "#795c5e" },
        new Category { Name = "Shopping", Color = "#66d2d8" },
        new Category { Name = "Transportation", Color = "#7d10a4" },
        new Category { Name = "Mobility", Color = "#bb8934" },
        new Category { Name = "Living", Color = "#e222e6" },
        new Category { Name = "Other Expense", Color = "#496b83" },
        new Category { Name = "Pets", Color = "#6a7456" },
        new Category { Name = "Children", Color = "#c046ea" },
        new Category { Name = "Entertainment", Color = "#6babe4" },
        new Category { Name = "Education", Color = "#da3e48" },
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
