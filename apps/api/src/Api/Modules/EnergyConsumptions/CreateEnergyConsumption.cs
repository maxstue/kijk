using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.EnergyConsumptions;

public record CreateEnergyConsumptionRequest(string Name, decimal Value, EnergyConsumptionType Type, DateTime Date);

public record CreateEnergyConsumptionResponse(Guid Id, string Name, decimal Value, EnergyConsumptionType Type, DateTime Date);

public class CreateEnergyConsumptionValidator : AbstractValidator<CreateEnergyConsumptionRequest>
{
    public CreateEnergyConsumptionValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Value)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Value' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Type' is not a valid energy consumption type");
        RuleFor(x => x.Date)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Date' must be set");
    }
}

public static class CreateEnergyConsumption
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateEnergyConsumption));

    public static RouteGroupBuilder MapCreateEnergyConsumption(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost("/", Handle)
            .WithRequestValidation<CreateEnergyConsumptionRequest>()
            .Produces<ApiResponse<TransactionDto>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    private static async Task<IResult> Handle(CreateEnergyConsumptionRequest createEnergyConsumptionRequest, AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var household = await dbContext.Households
                .Include(x => x.EnergyConsumptions)
                .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

            if (household is null)
            {
                return TypedResults.NotFound(ApiResponseBuilder.Error($"Household for id '{currentUser.ActiveHouseholdId}' was not found"));
            }

            var existingEnergyConsumption = await dbContext.EnergyConsumptions
                .FirstOrDefaultAsync(x => x.Date.Date == TimeProvider.System.GetUtcNow().DateTime.Date, cancellationToken);
            if (existingEnergyConsumption is not null)
            {
                return TypedResults.Conflict(ApiResponseBuilder.Error(
                    $"Energy consumption for the given date '{TimeProvider.System.GetUtcNow().DateTime.Date}' already exists"));
            }


            var energyConsumption = EnergyConsumption.Create(
                createEnergyConsumptionRequest.Name,
                createEnergyConsumptionRequest.Type,
                createEnergyConsumptionRequest.Value,
                household.Id,
                createEnergyConsumptionRequest.Date
            );

            dbContext.EnergyConsumptions.Add(energyConsumption);
            await dbContext.SaveChangesAsync(cancellationToken);

            var response = new CreateEnergyConsumptionResponse(
                energyConsumption.Id,
                energyConsumption.Name,
                energyConsumption.Value,
                energyConsumption.Type,
                energyConsumption.Date
            );

            return TypedResults.Ok(ApiResponseBuilder.Success(response));
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Failed to create energy consumption");
            return TypedResults.BadRequest(ApiResponseBuilder.Error("Failed to create energy consumption"));
        }
    }
}