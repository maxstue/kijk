using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace Kijk.Api.SourceGenerators.Tests;

public class EndpointGroupGeneratorTests
{
    private const string Contracts = """
        namespace Microsoft.AspNetCore.Routing
        {
            public interface IEndpointRouteBuilder { }
        }

        namespace Kijk.Api.Models
        {
            public interface IEndpointGroup
            {
                Microsoft.AspNetCore.Routing.IEndpointRouteBuilder MapEndpoints(
                    Microsoft.AspNetCore.Routing.IEndpointRouteBuilder builder);
            }
        }
        """;

    [Test]
    public async Task ValidEndpointGroupsAreGeneratedInDeterministicOrder()
    {
        var source = Contracts + """

            public abstract class EndpointBase : Kijk.Api.Models.IEndpointGroup
            {
                public Microsoft.AspNetCore.Routing.IEndpointRouteBuilder MapEndpoints(
                    Microsoft.AspNetCore.Routing.IEndpointRouteBuilder builder) => builder;
            }

            public sealed class ZebraEndpoints : EndpointBase { }
            public sealed class AlphaEndpoints : Kijk.Api.Models.IEndpointGroup
            {
                Microsoft.AspNetCore.Routing.IEndpointRouteBuilder Kijk.Api.Models.IEndpointGroup.MapEndpoints(
                    Microsoft.AspNetCore.Routing.IEndpointRouteBuilder builder) => builder;
            }
            """;

        var result = RunGenerator(source);
        var generatedSource = result.GeneratedTrees.Single().ToString();

        await Assert.That(result.Diagnostics).IsEmpty();
        await Assert.That(generatedSource).Contains("MapApiEndpoints(");
        await Assert.That(generatedSource).Contains("new global::AlphaEndpoints()).MapEndpoints(builder);");
        await Assert.That(generatedSource).Contains("new global::ZebraEndpoints()).MapEndpoints(builder);");
        await Assert.That(generatedSource.IndexOf("AlphaEndpoints", StringComparison.Ordinal))
            .IsLessThan(generatedSource.IndexOf("ZebraEndpoints", StringComparison.Ordinal));
        await Assert.That(generatedSource).DoesNotContain("EndpointBase()");
        await Assert.That(result.OutputCompilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)).IsEmpty();
    }

    [Test]
    public async Task NoEndpointGroupsStillGeneratesUsableMappingMethod()
    {
        var result = RunGenerator(Contracts);
        var generatedSource = result.GeneratedTrees.Single().ToString();

        await Assert.That(result.Diagnostics).IsEmpty();
        await Assert.That(generatedSource).Contains("return builder;");
        await Assert.That(result.OutputCompilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)).IsEmpty();
    }

    [Test]
    public async Task EndpointGroupWithoutAccessibleParameterlessConstructorReportsDiagnostic()
    {
        var source = Contracts + """

            public sealed class InvalidEndpoints(int value) : Kijk.Api.Models.IEndpointGroup
            {
                public Microsoft.AspNetCore.Routing.IEndpointRouteBuilder MapEndpoints(
                    Microsoft.AspNetCore.Routing.IEndpointRouteBuilder builder) => builder;
            }
            """;

        var result = RunGenerator(source);

        await Assert.That(result.Diagnostics.Select(static diagnostic => diagnostic.Id)).Contains("KIJKSG001");
    }

    [Test]
    public async Task GenericEndpointGroupReportsDiagnostic()
    {
        var source = Contracts + """

            public sealed class GenericEndpoints<T> : Kijk.Api.Models.IEndpointGroup
            {
                public Microsoft.AspNetCore.Routing.IEndpointRouteBuilder MapEndpoints(
                    Microsoft.AspNetCore.Routing.IEndpointRouteBuilder builder) => builder;
            }
            """;

        var result = RunGenerator(source);

        await Assert.That(result.Diagnostics.Select(static diagnostic => diagnostic.Id)).Contains("KIJKSG002");
    }

    private static GeneratorRunResult RunGenerator(string source)
    {
        var compilation = CSharpCompilation.Create(
            assemblyName: "GeneratorTests",
            syntaxTrees: [CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(LanguageVersion.Preview))],
            references: GetMetadataReferences(),
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        GeneratorDriver driver = CSharpGeneratorDriver.Create(new EndpointGroupGenerator())
            .WithUpdatedParseOptions((CSharpParseOptions)compilation.SyntaxTrees.Single().Options);
        driver = driver.RunGeneratorsAndUpdateCompilation(compilation, out var outputCompilation, out _);

        var result = driver.GetRunResult().Results.Single();
        return new GeneratorRunResult(result.Diagnostics, result.GeneratedSources.Select(static sourceResult => sourceResult.SyntaxTree).ToImmutableArray(), outputCompilation);
    }

    private static IEnumerable<MetadataReference> GetMetadataReferences()
    {
        var trustedPlatformAssemblies = (string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")
            ?? throw new InvalidOperationException("Trusted platform assemblies are unavailable.");

        return trustedPlatformAssemblies.Split(Path.PathSeparator).Select(static path => MetadataReference.CreateFromFile(path));
    }

    private sealed record GeneratorRunResult(
        ImmutableArray<Diagnostic> Diagnostics,
        ImmutableArray<SyntaxTree> GeneratedTrees,
        Compilation OutputCompilation);
}