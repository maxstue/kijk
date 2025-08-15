using Kijk.Shared;

namespace Kijk.Application.Resources.Shared;

public record ResourceResponse(Guid Id, string Name, string Color, string Unit, CreatorType CreatorType);