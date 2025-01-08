using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Energies;

public record CreateEnergyRequest(string Name, decimal Value, EnergyType Type, DateTime Date);

public record CreateEnergyResponse(Guid Id, string Name, decimal Value, EnergyType Type, DateTime Date);

public class CreateEnergyValidator : AbstractValidator<CreateEnergyRequest>
{
    public CreateEnergyValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Value)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Value' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Type' is not a valid energy consumption type");
        RuleFor(x => x.Date)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Date' must be set");
    }
}

public static class CreateEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateEnergy));

    public static RouteGroupBuilder MapCreateEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost("/", Handle)
            .WithRequestValidation<CreateEnergyRequest>()
            .Produces<TransactionDto>()
            .Produces<List<Error>>(StatusCodes.Status404NotFound)
            .Produces<List<Error>>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    private static async Task<IResult> Handle(CreateEnergyRequest createEnergyRequest, AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var household = await dbContext.Households
                .Include(x => x.Energies)
                .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

            if (household is null)
            {
                return TypedResults.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found");
            }

            var foundEnergy = await dbContext.Energy
                .FirstOrDefaultAsync(x => x.Date.Date == TimeProvider.System.GetUtcNow().DateTime.Date, cancellationToken);
            if (foundEnergy is not null)
            {
                return TypedResults.Conflict(
                    $"Energy consumption for the given date '{TimeProvider.System.GetUtcNow().DateTime.Date}' already exists");
            }


            var energy = Energy.Create(
                createEnergyRequest.Name,
                createEnergyRequest.Type,
                createEnergyRequest.Value,
                household.Id,
                createEnergyRequest.Date
            );

            dbContext.Energy.Add(energy);
            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new CreateEnergyResponse(
                energy.Id,
                energy.Name,
                energy.Value,
                energy.Type,
                energy.Date
            ));
        }
        catch (Exception e)
        {
            Logger.Error(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(e.Message);
        }
    }
}