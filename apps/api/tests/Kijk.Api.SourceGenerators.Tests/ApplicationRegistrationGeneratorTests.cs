using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace Kijk.Api.SourceGenerators.Tests;

public class ApplicationRegistrationGeneratorTests
{
    private const string Contracts = """
        namespace Microsoft.Extensions.DependencyInjection
        {
            public interface IServiceCollection { }

            public static class ServiceCollectionServiceExtensions
            {
                public static IServiceCollection AddTransient<TImplementation>(IServiceCollection services)
                    where TImplementation : class => services;

                public static IServiceCollection AddTransient<TService, TImplementation>(IServiceCollection services)
                    where TService : class
                    where TImplementation : class, TService => services;
            }
        }

        namespace Kijk.Application
        {
            public interface IModule
            {
                Microsoft.Extensions.DependencyInjection.IServiceCollection RegisterServices(
                    Microsoft.Extensions.DependencyInjection.IServiceCollection services);
            }

            public interface IHandler { }
        }
        """;

    [Test]
    public async Task ModulesAreGeneratedInDeterministicOrderAndAbstractModulesAreIgnored()
    {
        var source = Contracts + """

            public abstract class AbstractModule : Kijk.Application.IModule
            {
                public Microsoft.Extensions.DependencyInjection.IServiceCollection RegisterServices(
                    Microsoft.Extensions.DependencyInjection.IServiceCollection services) => services;
            }

            public sealed class ZebraModule : AbstractModule { }
            public sealed class AlphaModule : Kijk.Application.IModule
            {
                Microsoft.Extensions.DependencyInjection.IServiceCollection Kijk.Application.IModule.RegisterServices(
                    Microsoft.Extensions.DependencyInjection.IServiceCollection services) => services;
            }
            """;

        var result = RunGenerator(source);
        var generatedSource = GetGeneratedSource(result, "GeneratedModuleRegistrations.g.cs");

        await Assert.That(result.Diagnostics).IsEmpty();
        await Assert.That(generatedSource).Contains("new global::AlphaModule()).RegisterServices(services);");
        await Assert.That(generatedSource).Contains("new global::ZebraModule()).RegisterServices(services);");
        await Assert.That(generatedSource.IndexOf("AlphaModule", StringComparison.Ordinal))
            .IsLessThan(generatedSource.IndexOf("ZebraModule", StringComparison.Ordinal));
        await Assert.That(generatedSource).DoesNotContain("AbstractModule()");
        await Assert.That(GetCompilationErrors(result.OutputCompilation)).IsEmpty();
    }

    [Test]
    public async Task ModuleWithoutPublicParameterlessConstructorReportsDiagnostic()
    {
        var source = Contracts + """

            public sealed class InvalidModule(int value) : Kijk.Application.IModule
            {
                public Microsoft.Extensions.DependencyInjection.IServiceCollection RegisterServices(
                    Microsoft.Extensions.DependencyInjection.IServiceCollection services) => services;
            }
            """;

        var result = RunGenerator(source);

        await Assert.That(result.Diagnostics.Select(static diagnostic => diagnostic.Id)).Contains("KIJKSG003");
    }

    [Test]
    public async Task HandlersAreRegisteredForAllServiceInterfacesOrAsConcreteTypes()
    {
        var source = Contracts + """

            public interface IFirstService { }
            public interface ISecondService { }

            public sealed class ConcreteHandler : Kijk.Application.IHandler { }
            public sealed class MultiInterfaceHandler : Kijk.Application.IHandler, ISecondService, IFirstService { }
            """;

        var result = RunGenerator(source);
        var generatedSource = GetGeneratedSource(result, "GeneratedHandlerRegistrations.g.cs");

        await Assert.That(result.Diagnostics).IsEmpty();
        await Assert.That(generatedSource).Contains("AddTransient<global::ConcreteHandler>(services);");
        await Assert.That(generatedSource).Contains("AddTransient<global::IFirstService, global::MultiInterfaceHandler>(services);");
        await Assert.That(generatedSource).Contains("AddTransient<global::ISecondService, global::MultiInterfaceHandler>(services);");
        await Assert.That(generatedSource.IndexOf("IFirstService", StringComparison.Ordinal))
            .IsLessThan(generatedSource.IndexOf("ISecondService", StringComparison.Ordinal));
        await Assert.That(GetCompilationErrors(result.OutputCompilation)).IsEmpty();
    }

    [Test]
    public async Task IndirectHandlersAreGeneratedAndAbstractHandlersAreIgnored()
    {
        var source = Contracts + """

            public abstract class HandlerBase : Kijk.Application.IHandler { }
            public sealed class ConcreteHandler : HandlerBase { }
            """;

        var result = RunGenerator(source);
        var generatedSource = GetGeneratedSource(result, "GeneratedHandlerRegistrations.g.cs");

        await Assert.That(result.Diagnostics).IsEmpty();
        await Assert.That(generatedSource).Contains("AddTransient<global::ConcreteHandler>(services);");
        await Assert.That(generatedSource).DoesNotContain("AddTransient<global::HandlerBase>");
        await Assert.That(GetCompilationErrors(result.OutputCompilation)).IsEmpty();
    }

    [Test]
    public async Task GenericApplicationRegistrationReportsDiagnostic()
    {
        var source = Contracts + """

            public sealed class GenericHandler<T> : Kijk.Application.IHandler { }
            """;

        var result = RunGenerator(source);

        await Assert.That(result.Diagnostics.Select(static diagnostic => diagnostic.Id)).Contains("KIJKSG004");
    }

    [Test]
    public async Task ReferencedApplicationContractsDoNotGenerateRegistrationsInConsumingAssembly()
    {
        var applicationReference = CreateMetadataReference(Contracts);

        var result = RunGenerator("public sealed class ConsumerType { }", [applicationReference]);

        await Assert.That(result.Diagnostics).IsEmpty();
        await Assert.That(result.GeneratedTrees).IsEmpty();
        await Assert.That(GetCompilationErrors(result.OutputCompilation)).IsEmpty();
    }

    private static GeneratorRunResult RunGenerator(
        string source,
        IReadOnlyCollection<MetadataReference>? additionalReferences = null)
    {
        var references = GetMetadataReferences().Concat(additionalReferences ?? []).ToArray();
        var compilation = CSharpCompilation.Create(
            assemblyName: "GeneratorTests",
            syntaxTrees: [CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(LanguageVersion.Preview))],
            references: references,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        GeneratorDriver driver = CSharpGeneratorDriver.Create(
                new ModuleRegistrationGenerator(),
                new HandlerRegistrationGenerator())
            .WithUpdatedParseOptions((CSharpParseOptions)compilation.SyntaxTrees.Single().Options);
        driver = driver.RunGeneratorsAndUpdateCompilation(compilation, out var outputCompilation, out _);

        var results = driver.GetRunResult().Results;
        return new GeneratorRunResult(
            results.SelectMany(static result => result.Diagnostics).ToImmutableArray(),
            results.SelectMany(static result => result.GeneratedSources).Select(static sourceResult => sourceResult.SyntaxTree).ToImmutableArray(),
            outputCompilation);
    }

    private static string GetGeneratedSource(GeneratorRunResult result, string hintName) =>
        result.GeneratedTrees.Single(tree => tree.FilePath.EndsWith(hintName, StringComparison.Ordinal)).ToString();

    private static PortableExecutableReference CreateMetadataReference(string source)
    {
        var compilation = CSharpCompilation.Create(
            assemblyName: "Kijk.Application.Contracts",
            syntaxTrees: [CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(LanguageVersion.Preview))],
            references: GetMetadataReferences(),
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        using var stream = new MemoryStream();
        var emitResult = compilation.Emit(stream);
        if (!emitResult.Success)
        {
            throw new InvalidOperationException(string.Join(Environment.NewLine, emitResult.Diagnostics));
        }

        return MetadataReference.CreateFromImage(stream.ToArray());
    }

    private static IEnumerable<Diagnostic> GetCompilationErrors(Compilation compilation) =>
        compilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error);

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