using System.Collections.Immutable;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace Kijk.Api.SourceGenerators;

/// <summary>
/// Generates compile-time mappings for concrete endpoint-group implementations.
/// </summary>
[Generator(LanguageNames.CSharp)]
public sealed class EndpointGroupGenerator : IIncrementalGenerator
{
    private const string EndpointGroupMetadataName = "Kijk.Api.Models.IEndpointGroup";

    private static readonly DiagnosticDescriptor MissingParameterlessConstructor = new(
        id: "KIJKSG001",
        title: "Endpoint group must be constructible",
        messageFormat: "Endpoint group '{0}' must declare an accessible parameterless constructor",
        category: "Kijk.Api.SourceGenerators",
        defaultSeverity: DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description: "Generated endpoint mappings instantiate endpoint groups directly and therefore require an accessible parameterless constructor.");

    private static readonly DiagnosticDescriptor GenericEndpointGroup = new(
        id: "KIJKSG002",
        title: "Endpoint group cannot be generic",
        messageFormat: "Endpoint group '{0}' cannot be generic",
        category: "Kijk.Api.SourceGenerators",
        defaultSeverity: DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description: "Generated endpoint mappings cannot instantiate an open generic endpoint group.");

    /// <inheritdoc />
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        var endpointGroups = context.SyntaxProvider
            .CreateSyntaxProvider(
                static (node, _) => node is ClassDeclarationSyntax { BaseList: not null },
                static (syntaxContext, cancellationToken) => GetEndpointGroup(syntaxContext, cancellationToken))
            .Where(static symbol => symbol is not null)
            .Select(static (symbol, _) => symbol!);

        context.RegisterSourceOutput(
            endpointGroups.Collect().Combine(context.CompilationProvider),
            static (sourceContext, input) =>
            {
                if (IsApiCompilation(input.Right))
                {
                    Execute(sourceContext, input.Left);
                }
            });
    }

    private static INamedTypeSymbol? GetEndpointGroup(GeneratorSyntaxContext context, CancellationToken cancellationToken)
    {
        var declaration = (ClassDeclarationSyntax)context.Node;
        if (context.SemanticModel.GetDeclaredSymbol(declaration, cancellationToken) is not INamedTypeSymbol symbol || symbol.IsAbstract)
        {
            return null;
        }

        var endpointGroup = context.SemanticModel.Compilation.GetTypeByMetadataName(EndpointGroupMetadataName);
        return endpointGroup is not null && symbol.AllInterfaces.Any(@interface => SymbolEqualityComparer.Default.Equals(@interface, endpointGroup))
            ? symbol
            : null;
    }

    private static bool IsApiCompilation(Compilation compilation)
    {
        var endpointGroup = compilation.GetTypeByMetadataName(EndpointGroupMetadataName);
        return endpointGroup is not null
            && SymbolEqualityComparer.Default.Equals(endpointGroup.ContainingAssembly, compilation.Assembly);
    }

    private static void Execute(SourceProductionContext context, ImmutableArray<INamedTypeSymbol> candidates)
    {
        var endpointGroups = candidates
            .Distinct<INamedTypeSymbol>(SymbolEqualityComparer.Default)
            .OrderBy(static symbol => symbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat), StringComparer.Ordinal)
            .ToArray();

        var validEndpointGroups = new List<INamedTypeSymbol>(endpointGroups.Length);
        foreach (var endpointGroup in endpointGroups)
        {
            if (endpointGroup.IsGenericType)
            {
                context.ReportDiagnostic(Diagnostic.Create(GenericEndpointGroup, endpointGroup.Locations.FirstOrDefault(), endpointGroup.Name));
                continue;
            }

            if (!HasAccessibleParameterlessConstructor(endpointGroup))
            {
                context.ReportDiagnostic(Diagnostic.Create(MissingParameterlessConstructor, endpointGroup.Locations.FirstOrDefault(), endpointGroup.Name));
                continue;
            }

            validEndpointGroups.Add(endpointGroup);
        }

        context.AddSource("GeneratedEndpointMappings.g.cs", SourceText.From(Render(validEndpointGroups), Encoding.UTF8));
    }

    private static bool HasAccessibleParameterlessConstructor(INamedTypeSymbol endpointGroup) =>
        endpointGroup.InstanceConstructors.Any(static constructor =>
            constructor.Parameters.IsEmpty
            && constructor.DeclaredAccessibility is Accessibility.Public or Accessibility.Internal or Accessibility.ProtectedOrInternal);

    private static string Render(IReadOnlyCollection<INamedTypeSymbol> endpointGroups)
    {
        var source = new StringBuilder(
            """
            // <auto-generated />
            #nullable enable

            namespace Kijk.Api.Extensions;

            internal static class GeneratedEndpointMappings
            {
                internal static global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder MapApiEndpoints(
                    this global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder builder)
                {
            """);

        foreach (var endpointGroup in endpointGroups)
        {
            source.Append("        ((global::Kijk.Api.Models.IEndpointGroup)new ")
                .Append(endpointGroup.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat))
                .AppendLine("()).MapEndpoints(builder);");
        }

        return source.AppendLine("        return builder;")
            .AppendLine("    }")
            .AppendLine("}")
            .ToString();
    }
}