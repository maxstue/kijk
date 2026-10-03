using Kijk.Api.Mappers;
using Kijk.Application.Households.ChangeMemberRole;
using Kijk.Application.Households.GetMembers;
using Kijk.Application.Households.Update;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Units.Create;
using Kijk.Application.Units.Manage;
using Kijk.Application.Users.Update;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class HouseholdRoleTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [After(Class)]
    public static Task StopDatabase() => PostgreSqlTestDatabase.StopAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task MigrationsSeedTheRoleCatalog()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var roles = await dbContext.Roles.Include(role => role.Permissions).AsNoTracking().ToListAsync();
        var permissions = await dbContext.Permissions.AsNoTracking().Select(permission => permission.Name).ToListAsync();

        await Assert.That(permissions).IsEquivalentTo(HouseholdPermissions.All.Select(permission => permission.Name));
        await Assert.That(roles.Count).IsEqualTo(HouseholdRoles.All.Count);
        foreach (var definition in HouseholdRoles.All)
        {
            var role = roles.Single(item => item.Id == definition.Id);
            await Assert.That(role.Name).IsEqualTo(definition.Name);
            await Assert.That(role.Permissions.Select(permission => permission.Name)).IsEquivalentTo(definition.Permissions);
        }
    }

    [Test]
    public async Task CurrentUserProjectionContainsRoleAndPermissionsOfActiveHousehold()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        var member = await AddMemberAsync(dbContext, household, "member", HouseholdRoles.Member);
        var other = Household.Create("Other household");
        var adminRole = await dbContext.Roles.SingleAsync(role => role.Id == HouseholdRoles.Admin.Id);
        dbContext.UserHouseholds.Add(UserHousehold.Create(member, other, adminRole));
        await dbContext.SaveChangesAsync();

        var user = await dbContext.Users.Where(item => item.Id == member.Id).ToSimpleAuthUser().SingleAsync();

        await Assert.That(user.HouseholdId).IsEqualTo(household.Id);
        await Assert.That(user.HouseholdRole).IsEqualTo(HouseholdRoles.MemberName);
        await Assert.That(user.HouseholdPermissions).IsEquivalentTo(HouseholdRoles.Member.Permissions);
    }

    [Test]
    public async Task MemberCannotUpdateHouseholdButAdminCan()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, household, "admin", HouseholdRoles.Admin);
        var member = await AddMemberAsync(dbContext, household, "member", HouseholdRoles.Member);
        var request = new UpdateHouseholdRequest("Renamed", null);

        var memberResult = await new UpdateHouseholdHandler(dbContext, CurrentUserFor(member, household)).UpdateAsync(household.Id, request, CancellationToken.None);
        var adminResult = await new UpdateHouseholdHandler(dbContext, CurrentUserFor(admin, household)).UpdateAsync(household.Id, request, CancellationToken.None);

        await Assert.That(memberResult.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(adminResult.IsSuccess).IsTrue();
    }

    [Test]
    public async Task ViewerSeesMembersButOutsiderDoesNotFindTheHousehold()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        await AddMemberAsync(dbContext, household, "admin", HouseholdRoles.Admin);
        var viewer = await AddMemberAsync(dbContext, household, "viewer", HouseholdRoles.Viewer);
        var outsiderHousehold = Household.Create("Outsider household");
        var outsider = await AddMemberAsync(dbContext, outsiderHousehold, "outsider", HouseholdRoles.Admin);

        var viewerResult = await new GetHouseholdMembersHandler(dbContext, CurrentUserFor(viewer, household)).GetAllAsync(household.Id, CancellationToken.None);
        var outsiderResult = await new GetHouseholdMembersHandler(dbContext, CurrentUserFor(outsider, outsiderHousehold)).GetAllAsync(household.Id, CancellationToken.None);

        await Assert.That(viewerResult.IsSuccess).IsTrue();
        await Assert.That(viewerResult.Value.Select(item => item.Role.Name)).IsEquivalentTo([HouseholdRoles.AdminName, HouseholdRoles.ViewerName]);
        await Assert.That(viewerResult.Value.Single(item => item.IsCurrentUser).UserId).IsEqualTo(viewer.Id);
        await Assert.That(outsiderResult.Error.Type).IsEqualTo(ErrorType.NotFound);
    }

    [Test]
    public async Task AdminChangesTheRoleOfAnotherMember()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, household, "admin", HouseholdRoles.Admin);
        var member = await AddMemberAsync(dbContext, household, "member", HouseholdRoles.Member);

        var result = await new ChangeMemberRoleHandler(dbContext, CurrentUserFor(admin, household))
            .ChangeAsync(household.Id, member.Id, new(HouseholdRoles.Viewer.Id), CancellationToken.None);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value.Role.Permissions).IsEquivalentTo(HouseholdRoles.Viewer.Permissions);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var roleId = await verification.UserHouseholds
            .Where(link => link.HouseholdId == household.Id && link.UserId == member.Id)
            .Select(link => link.RoleId)
            .SingleAsync();
        await Assert.That(roleId).IsEqualTo(HouseholdRoles.Viewer.Id);
    }

    [Test]
    public async Task ChangingRolesRejectsMissingPermissionSelfChangeUnknownRoleAndUnknownMember()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, household, "admin", HouseholdRoles.Admin);
        var member = await AddMemberAsync(dbContext, household, "member", HouseholdRoles.Member);
        var asAdmin = new ChangeMemberRoleHandler(dbContext, CurrentUserFor(admin, household));
        var asMember = new ChangeMemberRoleHandler(dbContext, CurrentUserFor(member, household));

        var memberChangesAdmin = await asMember.ChangeAsync(household.Id, admin.Id, new(HouseholdRoles.Viewer.Id), CancellationToken.None);
        var adminChangesSelf = await asAdmin.ChangeAsync(household.Id, admin.Id, new(HouseholdRoles.Member.Id), CancellationToken.None);
        var unknownRole = await asAdmin.ChangeAsync(household.Id, member.Id, new(Guid.NewGuid()), CancellationToken.None);
        var unknownMember = await asAdmin.ChangeAsync(household.Id, Guid.NewGuid(), new(HouseholdRoles.Viewer.Id), CancellationToken.None);

        await Assert.That(memberChangesAdmin.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(adminChangesSelf.Error.Type).IsEqualTo(ErrorType.Validation);
        await Assert.That(unknownRole.Error.Type).IsEqualTo(ErrorType.Validation);
        await Assert.That(unknownMember.Error.Type).IsEqualTo(ErrorType.NotFound);
    }

    [Test]
    public async Task MemberCannotShareUnitsWithTheHousehold()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        var member = await AddMemberAsync(dbContext, household, "member", HouseholdRoles.Member);
        var unit = new Unit
        {
            Name = "Bucket",
            Symbol = "bucket",
            QuantityKey = "Custom:bucket",
            CreatorType = CreatorType.User,
            ConversionType = UnitConversionType.None,
            OwnerUserId = member.Id
        };
        dbContext.Units.Add(unit);
        await dbContext.SaveChangesAsync();

        var result = await new ManageUnitHandler(dbContext, CurrentUserFor(member, household), TimeProvider.System)
            .ShareAsync(unit.Id, household.Id, CancellationToken.None);

        await Assert.That(result.Error.Type).IsEqualTo(ErrorType.Authorization);
    }

    [Test]
    public async Task MemberCannotRenameTheHouseholdThroughTheProfileButCanSaveTheUnchangedName()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        var member = await AddMemberAsync(dbContext, household, "member", HouseholdRoles.Member);
        var handler = new UpdateUserHandler(
            dbContext, new UnusedIdentityProvider(), CurrentUserFor(member, household), TimeProvider.System, NullLogger<UpdateUserHandler>.Instance);

        var rename = await handler.UpdateAsync(new UpdateUserRequest("member", null, null, "Renamed", null), CancellationToken.None);
        var unchanged = await handler.UpdateAsync(new UpdateUserRequest("Member renamed", null, null, household.Name, null), CancellationToken.None);

        await Assert.That(rename.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(unchanged.IsSuccess).IsTrue();
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var householdName = await verification.Households.Where(item => item.Id == household.Id).Select(item => item.Name).SingleAsync();
        await Assert.That(householdName).IsEqualTo(household.Name);
    }

    [Test]
    public async Task CreatingAUnitSharedWithTheHouseholdRequiresTheSharePermission()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = await CreateHouseholdAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, household, "admin", HouseholdRoles.Admin);
        var member = await AddMemberAsync(dbContext, household, "member", HouseholdRoles.Member);
        var kilowattHour = new Guid("22222222-2222-4222-8222-222222222222");

        var asMember = await new CreateUnitHandler(dbContext, CurrentUserFor(member, household), TimeProvider.System)
            .CreateAsync(new CreateUnitRequest("Member battery", "mbat", kilowattHour, 2m, [household.Id]), CancellationToken.None);
        var asAdmin = await new CreateUnitHandler(dbContext, CurrentUserFor(admin, household), TimeProvider.System)
            .CreateAsync(new CreateUnitRequest("Admin battery", "abat", kilowattHour, 2m, [household.Id]), CancellationToken.None);

        await Assert.That(asMember.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(asAdmin.IsSuccess).IsTrue();
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Units.AnyAsync(unit => unit.Name == "Member battery")).IsFalse();
    }

    private static async Task<Household> CreateHouseholdAsync(AppDbContext dbContext)
    {
        var household = Household.Create("Shared household");
        dbContext.Households.Add(household);
        await dbContext.SaveChangesAsync();
        return household;
    }

    private static async Task<User> AddMemberAsync(AppDbContext dbContext, Household household, string name, RoleDefinition role)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        var roleEntity = await dbContext.Roles.SingleAsync(item => item.Id == role.Id);
        user.UserHouseholds.Add(UserHousehold.Create(user, household, roleEntity, isActive: true));
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static CurrentUser CurrentUserFor(User user, Household activeHousehold) =>
        new() { User = new SimpleAuthUser(user.Id, user.AuthId, activeHousehold.Id, user.Name, user.Email, true) };

    private sealed class UnusedIdentityProvider : IIdentityProvider
    {
        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }
}