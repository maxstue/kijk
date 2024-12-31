using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Transactions;

public record CreateTransactionRequest(string Name, decimal Amount, TransactionType Type, DateTime ExecutedAt, Guid? AccountId, Guid? CategoryId);

public class CreateTransactionsValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionsValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Amount)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Amount' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Type' is not a valid transaction type");

        RuleFor(x => x.ExecutedAt)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'ExecutedAt' must be set");
    }
}

public static class CreateTransaction
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateTransaction));

    public static RouteGroupBuilder MapCreateTransaction(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost("/", Handle)
            .WithRequestValidation<CreateTransactionRequest>()
            .Produces<ApiResponse<TransactionDto>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    /// <summary>
    /// Creates a new transaction.
    /// </summary>
    /// <param name="createTransactionRequest"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(
        CreateTransactionRequest createTransactionRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await dbContext.Users
                .Include(x => x.Accounts)
                .FirstOrDefaultAsync(x => x.Id == currentUser.Id, cancellationToken);
            if (user is null)
            {
                return TypedResults.NotFound(ApiResponseBuilder.Error($"User for id '{currentUser.Id}' was not found"));
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
                return TypedResults.NotFound(ApiResponseBuilder.Error($"Account with id '{createTransactionRequest.AccountId}' could not be found"));
            }

            Category? category;
            if (createTransactionRequest.CategoryId is not null)
            {
                var foundCategory = await dbContext.Categories
                    .FindAsync([createTransactionRequest.CategoryId], cancellationToken: cancellationToken);

                if (foundCategory is not null)
                {
                    category = foundCategory;
                }
                else
                {
                    Logger.Warning("Error: The selected category with id {CategoryId}, doesn't exist", createTransactionRequest.CategoryId);
                    return TypedResults.NotFound(
                        ApiResponseBuilder.Error($"The selected category with id '{createTransactionRequest.CategoryId}', doesn't exist"));
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
                return TypedResults.NotFound(ApiResponseBuilder.Error("Category could not be set"));
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
            var response = new TransactionDto(
                entity.Id,
                entity.Name,
                entity.Amount,
                entity.Type,
                entity.ExecutedAt,
                CategoryDto.Create(entity.Category));

            return TypedResults.Ok(ApiResponseBuilder.Success(response));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}