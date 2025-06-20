using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

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
public static class CreateConsumptionHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateConsumptionHandler));
    public static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> HandleAsync(CreateConsumptionRequest command,
        AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .Include(x => x.Consumptions)
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

        if (household is null)
        {
            Logger.Error("Household with id {HouseholdId} not found", currentUser.ActiveHouseholdId);
            return TypedResults.Problem(Error.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found").ToProblemDetails());
        }

        var foundEnergy = await dbContext.Consumptions
            .Include(x => x.Resource)
            .Where(x => x.Date.Value.Month == command.Date.Month && x.Date.Value.Year == command.Date.Year && x.ResourceId == command.ResourceId)
            .FirstOrDefaultAsync(cancellationToken);
        if (foundEnergy is not null)
        {
            Logger.Error("Consumption for '{ResourceId}' already exists for {Date:MMMM yyyy}", command.ResourceId, command.Date);
            return TypedResults.Problem(Error
                .Validation($"Consumption for '{command.ResourceId}' already exists for {command.Date:MMMM yyyy}")
                .ToProblemDetails());
        }

        var resource = await dbContext.Resources.FirstOrDefaultAsync(x => x.Id == command.ResourceId, cancellationToken);
        if (resource is null)
        {
            Logger.Error("Resource with id {ResourceId} not found", command.ResourceId);
            return TypedResults.Problem(Error.NotFound($"Resource for id '{command.ResourceId}' was not found").ToProblemDetails());
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

        return TypedResults.Ok(new ConsumptionResponse(
            energy.Id,
            energy.Name,
            energy.Description,
            energy.Value,
            new(energy.Resource.Id, energy.Resource.Name, energy.Resource.Unit, energy.Resource.Color),
            energy.Date.ToDateTime()
        ));
    }
}