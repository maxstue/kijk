using ArchUnitNET.Domain;
using ArchUnitNET.Fluent;
using ArchUnitNET.Loader;
using ArchUnitNET.TUnit;
using static ArchUnitNET.Fluent.ArchRuleDefinition;

namespace Kijk.ArchitectureTests;

public class LayerDependencyTests
{
    private static readonly Architecture Architecture = new ArchLoader()
        .LoadAssemblies(
            typeof(Api.DependencyInjection).Assembly,
            typeof(Application.DependencyInjection).Assembly,
            typeof(Domain.BaseEntity).Assembly,
            typeof(Infrastructure.DependencyInjection).Assembly,
            typeof(Shared.AppConstants).Assembly)
        .Build();

    // Code coverage instruments every assembly with a tracker type of the same full name. ArchUnit resolves all of
    // them to one assembly, so the layers exclude it; otherwise every layer would seem to depend on the API layer.
    private const string CoverageTracker = "Microsoft.CodeCoverage.Instrumentation.Static.Tracker";

    private static readonly IObjectProvider<IType> ApiLayer =
        Types().That().ResideInAssembly(typeof(Api.DependencyInjection).Assembly)
            .And().DoNotResideInNamespace(CoverageTracker).As("API layer");

    private static readonly IObjectProvider<IType> ApplicationLayer =
        Types().That().ResideInAssembly(typeof(Application.DependencyInjection).Assembly)
            .And().DoNotResideInNamespace(CoverageTracker).As("Application layer");

    private static readonly IObjectProvider<IType> DomainLayer =
        Types().That().ResideInAssembly(typeof(Domain.BaseEntity).Assembly)
            .And().DoNotResideInNamespace(CoverageTracker).As("Domain layer");

    private static readonly IObjectProvider<IType> InfrastructureLayer =
        Types().That().ResideInAssembly(typeof(Infrastructure.DependencyInjection).Assembly)
            .And().DoNotResideInNamespace(CoverageTracker).As("Infrastructure layer");

    [Test]
    public void DomainDoesNotDependOnOuterLayers()
    {
        Types().That().Are(DomainLayer).Should().NotDependOnAny(ApplicationLayer)
            .AndShould().NotDependOnAny(InfrastructureLayer)
            .AndShould().NotDependOnAny(ApiLayer)
            .Check(Architecture);
    }

    [Test]
    public void ApplicationDoesNotDependOnInfrastructureOrApi()
    {
        Types().That().Are(ApplicationLayer).Should().NotDependOnAny(InfrastructureLayer)
            .AndShould().NotDependOnAny(ApiLayer)
            .Check(Architecture);
    }

    [Test]
    public void InfrastructureDoesNotDependOnApi()
    {
        Types().That().Are(InfrastructureLayer).Should().NotDependOnAny(ApiLayer)
            .Check(Architecture);
    }
}