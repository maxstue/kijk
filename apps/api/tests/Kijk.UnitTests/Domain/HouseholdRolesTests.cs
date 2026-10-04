using System.Text.RegularExpressions;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;

namespace Kijk.UnitTests.Domain;

public partial class HouseholdRolesTests
{
    [Test]
    public async Task PermissionNamesAndIdsAreUniqueAndUseAreaVerbFormat()
    {
        var names = HouseholdPermissions.All.Select(permission => permission.Name).ToList();
        var ids = HouseholdPermissions.All.Select(permission => permission.Id).ToList();

        await Assert.That(names.Distinct(StringComparer.Ordinal).Count()).IsEqualTo(names.Count);
        await Assert.That(ids.Distinct().Count()).IsEqualTo(ids.Count);
        await Assert.That(names.All(name => PermissionFormat().IsMatch(name))).IsTrue();
    }

    [Test]
    public async Task RolesOnlyGrantPermissionsFromTheCatalog()
    {
        var catalog = HouseholdPermissions.All.Select(permission => permission.Name).ToHashSet(StringComparer.Ordinal);

        foreach (var permissions in HouseholdRoles.All.Select(role => role.Permissions))
        {
            await Assert.That(permissions.All(catalog.Contains)).IsTrue();
            await Assert.That(permissions.Distinct(StringComparer.Ordinal).Count()).IsEqualTo(permissions.Count);
        }
    }

    [Test]
    public async Task AdminGrantsEveryPermission()
    {
        var catalog = HouseholdPermissions.All.Select(permission => permission.Name);

        await Assert.That(HouseholdRoles.Admin.Permissions).IsEquivalentTo(catalog);
    }

    [Test]
    [Arguments(HouseholdPermissions.Limits.Plan)]
    [Arguments(HouseholdPermissions.Resources.Configure)]
    [Arguments(HouseholdPermissions.Units.Share)]
    [Arguments(HouseholdPermissions.Household.Configure)]
    [Arguments(HouseholdPermissions.Household.Delete)]
    [Arguments(HouseholdPermissions.Members.AssignRole)]
    [Arguments(HouseholdPermissions.Finances.Configure)]
    [Arguments(HouseholdPermissions.Budgets.Plan)]
    public async Task MemberAndViewerDoNotGetAdministrativePermissions(string permission)
    {
        await Assert.That(HouseholdRoles.Member.Permissions).DoesNotContain(permission);
        await Assert.That(HouseholdRoles.Viewer.Permissions).DoesNotContain(permission);
    }

    [Test]
    public async Task ViewerOnlyGetsViewPermissions() => await Assert.That(HouseholdRoles.Viewer.Permissions.All(permission => permission.EndsWith(":view", StringComparison.Ordinal))).IsTrue();

    [Test]
    public async Task RoleHasPermissionMatchesGrantedPermissionsExactly()
    {
        var role = new Role
        {
            Name = HouseholdRoles.MemberName,
            Permissions = [new Permission { Name = HouseholdPermissions.Consumptions.Record, Roles = [] }]
        };

        await Assert.That(role.HasPermission(HouseholdPermissions.Consumptions.Record)).IsTrue();
        await Assert.That(role.HasPermission(HouseholdPermissions.Consumptions.Export)).IsFalse();
        await Assert.That(role.HasPermission("CONSUMPTIONS:RECORD")).IsFalse();
    }

    [GeneratedRegex("^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*$")]
    private static partial Regex PermissionFormat();
}