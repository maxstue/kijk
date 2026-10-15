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
                public static IServiceCollection AddScoped<TService, TImplementation>(IServiceCollection services)
                    where TService : class
                    where TImplementation : class, TService => services;
            }
        }

        namespace FluentValidation
        {
            public interface IValidator<T> { }

            public abstract class AbstractValidator<T> : IValidator<T> { }
        }

        namespace Kijk.Application
        {
            public interface IModule
            {
                Microsoft.Extensions.DependencyInjection.IServiceCollection RegisterServices(
                    Microsoft.Extensions.DependencyInjection.IServiceCollection services);
            }
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
    public async Task GenericModuleReportsDiagnostic()
    {
        var source = Contracts + """

            public sealed class GenericModule<T> : Kijk.Application.IModule
            {
                public Microsoft.Extensions.DependencyInjection.IServiceCollection RegisterServices(
                    Microsoft.Extensions.DependencyInjection.IServiceCollection services) => services;
            }
            """;

        var result = RunGenerator(source);
        var generatedSource = GetGeneratedSource(result, "GeneratedModuleRegistrations.g.cs");

        await Assert.That(result.Diagnostics.Select(static diagnostic => diagnostic.Id)).Contains("KIJKSG004");
        await Assert.That(generatedSource).DoesNotContain("GenericModule");
    }

    [Test]
    public async Task GenericValidatorReportsDiagnostic()
    {
        var source = Contracts + """

            public sealed class GenericValidator<T> : FluentValidation.AbstractValidator<T> { }
            """;

        var result = RunGenerator(source);
        var generatedSource = GetGeneratedSource(result, "GeneratedValidatorRegistrations.g.cs");

        await Assert.That(result.Diagnostics.Select(static diagnostic => diagnostic.Id)).Contains("KIJKSG004");
        await Assert.That(generatedSource).DoesNotContain("GenericValidator");
    }

    [Test]
    public async Task ValidatorsAreRegisteredForTheirRequestTypesAndAbstractValidatorsAreIgnored()
    {
        var source = Contracts + """

            public sealed record FirstRequest;
            public sealed record SecondRequest;

            public abstract class ValidatorBase<T> : FluentValidation.AbstractValidator<T> { }
            public sealed class SecondRequestValidator : ValidatorBase<SecondRequest> { }
            public sealed class FirstRequestValidator : FluentValidation.AbstractValidator<FirstRequest> { }
            """;

        var result = RunGenerator(source);
        var generatedSource = GetGeneratedSource(result, "GeneratedValidatorRegistrations.g.cs");

        await Assert.That(result.Diagnostics).IsEmpty();
        await Assert.That(generatedSource).Contains("AddScoped<global::FluentValidation.IValidator<global::FirstRequest>, global::FirstRequestValidator>(services);");
        await Assert.That(generatedSource).Contains("AddScoped<global::FluentValidation.IValidator<global::SecondRequest>, global::SecondRequestValidator>(services);");
        await Assert.That(generatedSource.IndexOf("FirstRequestValidator", StringComparison.Ordinal))
            .IsLessThan(generatedSource.IndexOf("SecondRequestValidator", StringComparison.Ordinal));
        await Assert.That(generatedSource).DoesNotContain("ValidatorBase");
        await Assert.That(GetCompilationErrors(result.OutputCompilation)).IsEmpty();
    }

    [Test]
    public async Task SecondValidatorForTheSameRequestReportsDiagnostic()
    {
        var source = Contracts + """

            public sealed record Request;

            public sealed class FirstValidator : FluentValidation.AbstractValidator<Request> { }
            public sealed class SecondValidator : FluentValidation.AbstractValidator<Request> { }
            """;

        var result = RunGenerator(source);
        var generatedSource = GetGeneratedSource(result, "GeneratedValidatorRegistrations.g.cs");

        await Assert.That(result.Diagnostics.Select(static diagnostic => diagnostic.Id)).Contains("KIJKSG005");
        await Assert.That(generatedSource).Contains("global::FirstValidator>(services);");
        await Assert.That(generatedSource).DoesNotContain("global::SecondValidator>(services);");
    }

    [Test]
    public async Task ReferencedApplicationContractsDoNotGenerateRegistrationsInConsumingAssembly()
    {
        var applicationReference = CreateMetadataReference(Contracts);

        var result = RunGenerator(
            "public sealed class ConsumerValidator : FluentValidation.AbstractValidator<ConsumerValidator> { }",
            [applicationReference]);

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
                new ValidatorRegistrationGenerator())
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