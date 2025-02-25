using Kijk.Shared;

namespace Kijk.Application.Energies.Models;

public record CreateEnergyRequest(string Name, decimal Value, EnergyType Type, DateTime Date);

public record EnergyStatsTypeResponse(EnergyStatsResponse Electricity, EnergyStatsResponse Gas, EnergyStatsResponse Water);

public record UpdateEnergyRequest(string? Name, decimal? Value, EnergyType? Type, DateTime? Date);
