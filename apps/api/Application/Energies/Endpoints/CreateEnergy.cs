using Kijk.Application.Energies.Models;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Energies.Endpoints;

public static class CreateEnergy
{
    public static async Task<Results<Ok<EnergyResponse>, ProblemHttpResult>> HandleAsync(CreateEnergyRequest createEnergyRequest,
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

        return TypedResults.Ok(new EnergyResponse(
            energy.Id,
            energy.Name,
            energy.Description,
            energy.Value,
            energy.Type,
            energy.Date
        ));
    }

    private static IQueryable<Energy> FilterByMonthYearAndType(this IQueryable<Energy> query, int month, int year, EnergyType type) =>
        query.Where(x => x.Date.Month == month && x.Date.Year == year && x.Type == type);
}