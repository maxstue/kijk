using Kijk.Application.Energies.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Energies.Endpoints;

public static class UpdateEnergy
{
    public static async Task<Results<Ok<EnergyResponse>, ProblemHttpResult>> HandleAsync(Guid id, UpdateEnergyRequest updateEnergyRequest,
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

        var existingEnergy = await dbContext.Energy.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (existingEnergy is null)
        {
            return TypedResults.Problem(Error.NotFound($"Energy consumption for id '{id}' was not found").ToProblemDetails());
        }

        existingEnergy.Name = updateEnergyRequest.Name ?? existingEnergy.Name;
        existingEnergy.Value = updateEnergyRequest.Value ?? existingEnergy.Value;
        existingEnergy.Type = updateEnergyRequest.Type ?? existingEnergy.Type;
        existingEnergy.Date = updateEnergyRequest.Date ?? existingEnergy.Date;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new EnergyResponse(
            existingEnergy.Id,
            existingEnergy.Name,
            existingEnergy.Description,
            existingEnergy.Value,
            existingEnergy.Type,
            existingEnergy.Date
        ));
    }
}