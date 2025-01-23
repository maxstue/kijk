using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

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
    public static RouteGroupBuilder MapCreateEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost("/", Handle)
            .WithRequestValidation<CreateEnergyRequest>();

        return groupBuilder;
    }

    private static async Task<Results<Ok<CreateEnergyResponse>, ProblemHttpResult>> Handle(CreateEnergyRequest createEnergyRequest,
        AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .Include(x => x.Energies)
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

        if (household is null)
        {
            return TypedResults.Problem(Error.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found").ToProblemDetails());
        }

        var foundEnergy = await dbContext.Energy
            .FilterByMonthYearAndType(createEnergyRequest.Date.Month, createEnergyRequest.Date.Year, createEnergyRequest.Type)
            .FirstOrDefaultAsync(cancellationToken);
        if (foundEnergy is not null)
        {
            return TypedResults.Problem(Error
                .Validation($"Energy usage for '{createEnergyRequest.Type}' already exists for {createEnergyRequest.Date:MMMM yyyy}")
                .ToProblemDetails());
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

    private static IQueryable<Energy> FilterByMonthYearAndType(this IQueryable<Energy> query, int month, int year, EnergyType type) =>
        query.Where(x => x.Date.Month == month && x.Date.Year == year && x.Type == type);
}