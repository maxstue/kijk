using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Kijk.Api.SourceGenerators;

internal static class GeneratorUtilities
{
    internal static IncrementalValuesProvider<INamedTypeSymbol> CreateImplementationsProvider(
        IncrementalGeneratorInitializationContext context,
        string interfaceMetadataName) =>
        context.SyntaxProvider
            .CreateSyntaxProvider(
                static (node, _) => node is ClassDeclarationSyntax { BaseList: not null },
                (syntaxContext, cancellationToken) => GetImplementation(syntaxContext, interfaceMetadataName, cancellationToken))
            .Where(static symbol => symbol is not null)
            .Select(static (symbol, _) => symbol!);

    internal static bool IsDefiningCompilation(Compilation compilation, string interfaceMetadataName)
    {
        var markerInterface = compilation.GetTypeByMetadataName(interfaceMetadataName);
        return markerInterface is not null
            && SymbolEqualityComparer.Default.Equals(markerInterface.ContainingAssembly, compilation.Assembly);
    }

    internal static INamedTypeSymbol[] GetDistinctOrderedSymbols(ImmutableArray<INamedTypeSymbol> candidates) =>
        candidates
            .Distinct<INamedTypeSymbol>(SymbolEqualityComparer.Default)
            .OrderBy(static symbol => symbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat), StringComparer.Ordinal)
            .ToArray();

    internal static bool ReportGenericType(SourceProductionContext context, INamedTypeSymbol symbol)
    {
        if (!symbol.IsGenericType)
        {
            return false;
        }

        context.ReportDiagnostic(Diagnostic.Create(
            GeneratorDiagnostics.GenericApplicationRegistration,
            symbol.Locations.FirstOrDefault(),
            symbol.Name));
        return true;
    }

    private static INamedTypeSymbol? GetImplementation(
        GeneratorSyntaxContext context,
        string interfaceMetadataName,
        CancellationToken cancellationToken)
    {
        var declaration = (ClassDeclarationSyntax)context.Node;
        if (context.SemanticModel.GetDeclaredSymbol(declaration, cancellationToken) is not INamedTypeSymbol symbol || symbol.IsAbstract)
        {
            return null;
        }

        var markerInterface = context.SemanticModel.Compilation.GetTypeByMetadataName(interfaceMetadataName);
        return markerInterface is not null && symbol.AllInterfaces.Any(@interface => SymbolEqualityComparer.Default.Equals(@interface, markerInterface))
            ? symbol
            : null;
    }
}