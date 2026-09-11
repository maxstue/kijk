using Microsoft.CodeAnalysis;

namespace Kijk.Api.SourceGenerators;

internal static class GeneratorDiagnostics
{
    internal static readonly DiagnosticDescriptor InvalidModuleConstructor = new(
        id: "KIJKSG003",
        title: "Application module must be constructible",
        messageFormat: "Application module '{0}' must declare a public parameterless constructor",
        category: "Kijk.Api.SourceGenerators",
        defaultSeverity: DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description: "Generated module registration instantiates application modules directly and therefore requires a public parameterless constructor.");

    internal static readonly DiagnosticDescriptor GenericApplicationRegistration = new(
        id: "KIJKSG004",
        title: "Application registration type cannot be generic",
        messageFormat: "Application registration type '{0}' cannot be generic",
        category: "Kijk.Api.SourceGenerators",
        defaultSeverity: DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description: "Generated application registrations cannot register open generic modules or handlers.");
}