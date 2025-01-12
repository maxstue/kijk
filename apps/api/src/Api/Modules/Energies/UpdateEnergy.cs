using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Energies;

public record UpdateEnergyRequest(string? Name, decimal? Value, EnergyType? Type, DateTime? Date);

public record UpdateEnergyResponse(Guid Id, string Name, decimal Value, EnergyType Type, DateTime Date);

public static class UpdateEnergy
{
    public static RouteGroupBuilder MapUpdateEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/{id:guid}", Handle);

        return groupBuilder;
    }

    private static async Task<Results<Ok<UpdateEnergyResponse>, ProblemHttpResult>> Handle(Guid id, UpdateEnergyRequest updateEnergyRequest,
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

        return TypedResults.Ok(new UpdateEnergyResponse(
            existingEnergy.Id,
            existingEnergy.Name,
            existingEnergy.Value,
            existingEnergy.Type,
            existingEnergy.Date
        ));
    }
}