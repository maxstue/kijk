using System.Text.RegularExpressions;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;

namespace Kijk.UnitTests.Domain;

public partial class SpaceRolesTests
{
    [Test]
    public async Task PermissionNamesAndIdsAreUniqueAndUseAreaVerbFormat()
    {
        var names = SpacePermissions.All.Select(permission => permission.Name).ToList();
        var ids = SpacePermissions.All.Select(permission => permission.Id).ToList();

        await Assert.That(names.Distinct(StringComparer.Ordinal).Count()).IsEqualTo(names.Count);
        await Assert.That(ids.Distinct().Count()).IsEqualTo(ids.Count);
        await Assert.That(names.All(name => PermissionFormat().IsMatch(name))).IsTrue();
    }

    [Test]
    public async Task RolesOnlyGrantPermissionsFromTheCatalog()
    {
        var catalog = SpacePermissions.All.Select(permission => permission.Name).ToHashSet(StringComparer.Ordinal);

        foreach (var permissions in SpaceRoles.All.Select(role => role.Permissions))
        {
            await Assert.That(permissions.All(catalog.Contains)).IsTrue();
            await Assert.That(permissions.Distinct(StringComparer.Ordinal).Count()).IsEqualTo(permissions.Count);
        }
    }

    [Test]
    public async Task AdminGrantsEveryPermission()
    {
        var catalog = SpacePermissions.All.Select(permission => permission.Name);

        await Assert.That(SpaceRoles.Admin.Permissions).IsEquivalentTo(catalog);
    }

    [Test]
    [Arguments(SpacePermissions.Limits.Plan)]
    [Arguments(SpacePermissions.Resources.Configure)]
    [Arguments(SpacePermissions.Units.Share)]
    [Arguments(SpacePermissions.Space.Configure)]
    [Arguments(SpacePermissions.Space.Delete)]
    [Arguments(SpacePermissions.Members.AssignRole)]
    [Arguments(SpacePermissions.Finances.Configure)]
    [Arguments(SpacePermissions.Budgets.Plan)]
    public async Task MemberAndViewerDoNotGetAdministrativePermissions(string permission)
    {
        await Assert.That(SpaceRoles.Member.Permissions).DoesNotContain(permission);
        await Assert.That(SpaceRoles.Viewer.Permissions).DoesNotContain(permission);
    }

    [Test]
    public async Task ViewerOnlyGetsViewPermissions() => await Assert.That(SpaceRoles.Viewer.Permissions.All(permission => permission.EndsWith(":view", StringComparison.Ordinal))).IsTrue();

    [Test]
    public async Task RoleHasPermissionMatchesGrantedPermissionsExactly()
    {
        var role = new Role
        {
            Name = SpaceRoles.MemberName,
            Permissions = [new Permission { Name = SpacePermissions.Consumptions.Record, Roles = [] }]
        };

        await Assert.That(role.HasPermission(SpacePermissions.Consumptions.Record)).IsTrue();
        await Assert.That(role.HasPermission(SpacePermissions.Consumptions.Export)).IsFalse();
        await Assert.That(role.HasPermission("CONSUMPTIONS:RECORD")).IsFalse();
    }

    [GeneratedRegex("^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*$")]
    private static partial Regex PermissionFormat();
}