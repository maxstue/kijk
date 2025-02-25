using Kijk.Application.Transactions.Models;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Transactions.Endpoints;

public static class CreateTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateTransaction));

    /// <summary>
    /// Creates a new transaction.
    /// </summary>
    /// <param name="createTransactionRequest"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<TransactionResponse>, ProblemHttpResult>> HandleAsync(
        CreateTransactionRequest createTransactionRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Accounts)
            .FirstOrDefaultAsync(x => x.Id == currentUser.Id, cancellationToken);
        if (user is null)
        {
            return TypedResults.Problem(Error.NotFound($"User for id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        var accountId = createTransactionRequest.AccountId;
        if (accountId == null || accountId == Guid.Empty)
        {
            accountId = user.Accounts.Find(x => x.Name == AppConstants.DefaultValues.AccountName)?.Id;
        }

        var account = await dbContext.Accounts
            .Where(x => x.Id == accountId)
            .Where(x => x.UserId == user.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (account is null)
        {
            Logger.Warning("Error: Account with id {AccountId} could not be found", createTransactionRequest.AccountId);
            return TypedResults.Problem(Error.NotFound($"Account with id '{createTransactionRequest.AccountId}' could not be found")
                .ToProblemDetails());
        }

        Category? category;
        if (createTransactionRequest.CategoryId is not null)
        {
            var foundCategory = await dbContext.Categories.FindAsync([createTransactionRequest.CategoryId], cancellationToken: cancellationToken);
            if (foundCategory is not null)
            {
                category = foundCategory;
            }
            else
            {
                Logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", createTransactionRequest.CategoryId);
                return TypedResults.Problem(Error.NotFound($"The selected category with id '{createTransactionRequest.CategoryId}', doesn't exist")
                    .ToProblemDetails());
            }
        }
        else
        {
            category = await dbContext.Categories
                .Where(x => x.CreatorType == CategoryCreatorType.Default && x.Name == "Uncategorized")
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (category is null)
        {
            Logger.Warning("Category could not be set");
            return TypedResults.Problem(Error.Unexpected("Category could not be set").ToProblemDetails());
        }

        var newTransaction = Transaction.Create(
            createTransactionRequest.Name,
            createTransactionRequest.Amount,
            createTransactionRequest.Type,
            createTransactionRequest.ExecutedAt,
            account,
            category);

        var resEntityEntry = await dbContext.Transactions.AddAsync(newTransaction, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var entity = resEntityEntry.Entity;

        return TypedResults.Ok(new TransactionResponse(
            entity.Id,
            entity.Name,
            entity.Amount,
            entity.Type,
            entity.ExecutedAt,
            TransactionCategoryResponse.Create(entity.Category)));
    }
}