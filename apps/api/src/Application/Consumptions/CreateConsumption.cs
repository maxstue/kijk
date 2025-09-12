using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;
using NetEscapades.EnumGenerators;

namespace Kijk.Application.Consumptions;

public record CreateConsumptionRequest(string Name, decimal Value, CreateConsumptionValueTypes ValueType, Guid ResourceId, DateTime Date);

[EnumExtensions]
public enum CreateConsumptionValueTypes { Absolute, Relative };

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
    public async Task<Result<ConsumptionResponse>> CreateAsync(CreateConsumptionRequest request, CancellationToken cancellationToken)
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
            .Where(x => x.Date.Value.Month == request.Date.Month && x.Date.Value.Year == request.Date.Year && x.ResourceId == request.ResourceId)
            .FirstOrDefaultAsync(cancellationToken);
        if (foundEnergy is not null)
        {
            logger.LogError("Consumption for '{ResourceId}' already exists for {Date:MMMM yyyy}", request.ResourceId, request.Date);
            return Error.Validation($"Consumption for '{request.ResourceId}' already exists for {request.Date:MMMM yyyy}");
        }

        var resource = await dbContext.Resources.FirstOrDefaultAsync(x => x.Id == request.ResourceId, cancellationToken);
        if (resource is null)
        {
            logger.LogError("Resource with id {ResourceId} not found", request.ResourceId);
            return Error.NotFound($"Resource for id '{request.ResourceId}' was not found");
        }

        var consumption = await CreateConsumption(request, resource, household, cancellationToken);

        dbContext.Consumptions.Add(consumption);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ConsumptionResponse(
            consumption.Id,
            consumption.Name,
            consumption.Description,
            consumption.Value,
            new(consumption.Resource.Id, consumption.Resource.Name, consumption.Resource.Unit, consumption.Resource.Color),
            consumption.Date.ToDateTime());
    }

    private async Task<Consumption> CreateConsumption(CreateConsumptionRequest request, Resource resource, Household household, CancellationToken cancellationToken)
    {
        var calculatedValue = request.Value;
        if (request.ValueType == CreateConsumptionValueTypes.Absolute)
        {
            return Consumption.Create(
                request.Name,
                resource,
                calculatedValue,
                household,
                request.Date
            );
        }

        var lastConsumptionValue = await dbContext.Consumptions
            .Where(x => x.Date.Value.Month == request.Date.Month && x.Date.Value.Year == request.Date.Year && x.ResourceId == request.ResourceId)
            .OrderByDescending(x => x.Date)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);

        calculatedValue = lastConsumptionValue + request.Value;

        return Consumption.Create(
            request.Name,
            resource,
            calculatedValue,
            household,
            request.Date
        );
    }
}