using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions;

public record CreateConsumptionRequest(string Name, decimal Value, Guid ResourceId, DateTime Date);

/// <summary>
/// Validator for the <see cref="CreateConsumptionRequest"/>
/// </summary>
public class CreateConsumptionCommandValidator : AbstractValidator<CreateConsumptionRequest>
{
    public CreateConsumptionCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Value)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Value' must be set");

        RuleFor(x => x.ResourceId)
            .NotNull().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'ResourceId' must be set");

        RuleFor(x => x.Date)
            .Must(date => date.Date <= DateTime.UtcNow.Date)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'Date' must not be in the future")
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Date' must be set");
    }
}

/// <summary>
/// Handler for creating a new consumption.
/// </summary>
public class CreateConsumptionHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<CreateConsumptionHandler> logger) : IHandler
{
    public async Task<Result<ConsumptionResponse>> CreateAsync(CreateConsumptionRequest command, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .Include(x => x.Consumptions)
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

        if (household is null)
        {
            logger.LogError("Household with id {HouseholdId} not found", currentUser.ActiveHouseholdId);
            return Error.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found");
        }

        var foundEnergy = await dbContext.Consumptions
            .Include(x => x.Resource)
            .Where(x => x.Date.Value.Month == command.Date.Month && x.Date.Value.Year == command.Date.Year && x.ResourceId == command.ResourceId)
            .FirstOrDefaultAsync(cancellationToken);
        if (foundEnergy is not null)
        {
            logger.LogError("Consumption for '{ResourceId}' already exists for {Date:MMMM yyyy}", command.ResourceId, command.Date);
            return Error.Validation($"Consumption for '{command.ResourceId}' already exists for {command.Date:MMMM yyyy}");
        }

        var resource = await dbContext.Resources.FirstOrDefaultAsync(x => x.Id == command.ResourceId, cancellationToken);
        if (resource is null)
        {
            logger.LogError("Resource with id {ResourceId} not found", command.ResourceId);
            return Error.NotFound($"Resource for id '{command.ResourceId}' was not found");
        }


        var energy = Consumption.Create(
            command.Name,
            resource,
            command.Value,
            household,
            command.Date
        );

        dbContext.Consumptions.Add(energy);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ConsumptionResponse(
            energy.Id,
            energy.Name,
            energy.Description,
            energy.Value,
            new(energy.Resource.Id, energy.Resource.Name, energy.Resource.Unit, energy.Resource.Color),
            energy.Date.ToDateTime()
        );
    }
}