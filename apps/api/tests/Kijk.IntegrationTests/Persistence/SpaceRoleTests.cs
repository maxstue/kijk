using Kijk.Api.Mappers;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.GetMembers;
using Kijk.Application.Spaces.Update;
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
public class SpaceRoleTests
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

        await Assert.That(permissions).IsEquivalentTo(SpacePermissions.All.Select(permission => permission.Name));
        await Assert.That(roles.Count).IsEqualTo(SpaceRoles.All.Count);
        foreach (var definition in SpaceRoles.All)
        {
            var role = roles.Single(item => item.Id == definition.Id);
            await Assert.That(role.Name).IsEqualTo(definition.Name);
            await Assert.That(role.Permissions.Select(permission => permission.Name)).IsEquivalentTo(definition.Permissions);
        }
    }

    [Test]
    public async Task CurrentUserProjectionContainsRoleAndPermissionsOfActiveSpace()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        var member = await AddMemberAsync(dbContext, space, "member", SpaceRoles.Member);
        var other = Space.Create("Other space");
        var adminRole = await dbContext.Roles.SingleAsync(role => role.Id == SpaceRoles.Admin.Id);
        dbContext.UserSpaces.Add(UserSpace.Create(member, other, adminRole));
        await dbContext.SaveChangesAsync();

        var user = await dbContext.Users.Where(item => item.Id == member.Id).ToSimpleAuthUser().SingleAsync();

        await Assert.That(user.SpaceId).IsEqualTo(space.Id);
        await Assert.That(user.SpaceRole).IsEqualTo(SpaceRoles.MemberName);
        await Assert.That(user.SpacePermissions).IsEquivalentTo(SpaceRoles.Member.Permissions);
    }

    [Test]
    public async Task MemberCannotUpdateSpaceButAdminCan()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, space, "admin", SpaceRoles.Admin);
        var member = await AddMemberAsync(dbContext, space, "member", SpaceRoles.Member);
        var request = new UpdateSpaceRequest("Renamed", null);

        var memberResult = await new UpdateSpaceHandler(dbContext, CurrentUserFor(member, space)).UpdateAsync(space.Id, request, CancellationToken.None);
        var adminResult = await new UpdateSpaceHandler(dbContext, CurrentUserFor(admin, space)).UpdateAsync(space.Id, request, CancellationToken.None);

        await Assert.That(memberResult.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(adminResult.IsSuccess).IsTrue();
    }

    [Test]
    public async Task ViewerSeesMembersButOutsiderDoesNotFindTheSpace()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        await AddMemberAsync(dbContext, space, "admin", SpaceRoles.Admin);
        var viewer = await AddMemberAsync(dbContext, space, "viewer", SpaceRoles.Viewer);
        var outsiderSpace = Space.Create("Outsider space");
        var outsider = await AddMemberAsync(dbContext, outsiderSpace, "outsider", SpaceRoles.Admin);

        var viewerResult = await new GetSpaceMembersHandler(dbContext, CurrentUserFor(viewer, space)).GetAllAsync(space.Id, CancellationToken.None);
        var outsiderResult = await new GetSpaceMembersHandler(dbContext, CurrentUserFor(outsider, outsiderSpace)).GetAllAsync(space.Id, CancellationToken.None);

        await Assert.That(viewerResult.IsSuccess).IsTrue();
        await Assert.That(viewerResult.Value.Select(item => item.Role.Name)).IsEquivalentTo([SpaceRoles.AdminName, SpaceRoles.ViewerName]);
        await Assert.That(viewerResult.Value.Single(item => item.IsCurrentUser).UserId).IsEqualTo(viewer.Id);
        await Assert.That(outsiderResult.Error.Type).IsEqualTo(ErrorType.NotFound);
    }

    [Test]
    public async Task AdminChangesTheRoleOfAnotherMember()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, space, "admin", SpaceRoles.Admin);
        var member = await AddMemberAsync(dbContext, space, "member", SpaceRoles.Member);

        var result = await new ChangeMemberRoleHandler(dbContext, CurrentUserFor(admin, space))
            .ChangeAsync(space.Id, member.Id, new(SpaceRoles.Viewer.Id), CancellationToken.None);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value.Role.Permissions).IsEquivalentTo(SpaceRoles.Viewer.Permissions);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var roleId = await verification.UserSpaces
            .Where(link => link.SpaceId == space.Id && link.UserId == member.Id)
            .Select(link => link.RoleId)
            .SingleAsync();
        await Assert.That(roleId).IsEqualTo(SpaceRoles.Viewer.Id);
    }

    [Test]
    public async Task ChangingRolesRejectsMissingPermissionSelfChangeUnknownRoleAndUnknownMember()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, space, "admin", SpaceRoles.Admin);
        var member = await AddMemberAsync(dbContext, space, "member", SpaceRoles.Member);
        var asAdmin = new ChangeMemberRoleHandler(dbContext, CurrentUserFor(admin, space));
        var asMember = new ChangeMemberRoleHandler(dbContext, CurrentUserFor(member, space));

        var memberChangesAdmin = await asMember.ChangeAsync(space.Id, admin.Id, new(SpaceRoles.Viewer.Id), CancellationToken.None);
        var adminChangesSelf = await asAdmin.ChangeAsync(space.Id, admin.Id, new(SpaceRoles.Member.Id), CancellationToken.None);
        var unknownRole = await asAdmin.ChangeAsync(space.Id, member.Id, new(Guid.NewGuid()), CancellationToken.None);
        var unknownMember = await asAdmin.ChangeAsync(space.Id, Guid.NewGuid(), new(SpaceRoles.Viewer.Id), CancellationToken.None);

        await Assert.That(memberChangesAdmin.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(adminChangesSelf.Error.Type).IsEqualTo(ErrorType.Validation);
        await Assert.That(unknownRole.Error.Type).IsEqualTo(ErrorType.Validation);
        await Assert.That(unknownMember.Error.Type).IsEqualTo(ErrorType.NotFound);
    }

    [Test]
    public async Task MemberCannotShareUnitsWithTheSpace()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        var member = await AddMemberAsync(dbContext, space, "member", SpaceRoles.Member);
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

        var result = await new ManageUnitHandler(dbContext, CurrentUserFor(member, space), TimeProvider.System)
            .ShareAsync(unit.Id, space.Id, CancellationToken.None);

        await Assert.That(result.Error.Type).IsEqualTo(ErrorType.Authorization);
    }

    [Test]
    public async Task MemberCannotRenameTheSpaceThroughTheProfileButCanSaveTheUnchangedName()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        var member = await AddMemberAsync(dbContext, space, "member", SpaceRoles.Member);
        var handler = new UpdateUserHandler(
            dbContext, new UnusedIdentityProvider(), CurrentUserFor(member, space), TimeProvider.System, NullLogger<UpdateUserHandler>.Instance);

        var rename = await handler.UpdateAsync(new UpdateUserRequest("member", null, null, "Renamed", null), CancellationToken.None);
        var unchanged = await handler.UpdateAsync(new UpdateUserRequest("Member renamed", null, null, space.Name, null), CancellationToken.None);

        await Assert.That(rename.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(unchanged.IsSuccess).IsTrue();
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var spaceName = await verification.Spaces.Where(item => item.Id == space.Id).Select(item => item.Name).SingleAsync();
        await Assert.That(spaceName).IsEqualTo(space.Name);
    }

    [Test]
    public async Task CreatingAUnitSharedWithTheSpaceRequiresTheSharePermission()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await CreateSpaceAsync(dbContext);
        var admin = await AddMemberAsync(dbContext, space, "admin", SpaceRoles.Admin);
        var member = await AddMemberAsync(dbContext, space, "member", SpaceRoles.Member);
        var kilowattHour = new Guid("22222222-2222-4222-8222-222222222222");

        var asMember = await new CreateUnitHandler(dbContext, CurrentUserFor(member, space), TimeProvider.System)
            .CreateAsync(new CreateUnitRequest("Member battery", "mbat", kilowattHour, 2m, [space.Id]), CancellationToken.None);
        var asAdmin = await new CreateUnitHandler(dbContext, CurrentUserFor(admin, space), TimeProvider.System)
            .CreateAsync(new CreateUnitRequest("Admin battery", "abat", kilowattHour, 2m, [space.Id]), CancellationToken.None);

        await Assert.That(asMember.Error.Type).IsEqualTo(ErrorType.Authorization);
        await Assert.That(asAdmin.IsSuccess).IsTrue();
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Units.AnyAsync(unit => unit.Name == "Member battery")).IsFalse();
    }

    private static async Task<Space> CreateSpaceAsync(AppDbContext dbContext)
    {
        var space = Space.Create("Shared space");
        dbContext.Spaces.Add(space);
        await dbContext.SaveChangesAsync();
        return space;
    }

    private static async Task<User> AddMemberAsync(AppDbContext dbContext, Space space, string name, RoleDefinition role)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        var roleEntity = await dbContext.Roles.SingleAsync(item => item.Id == role.Id);
        user.UserSpaces.Add(UserSpace.Create(user, space, roleEntity, isActive: true));
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static CurrentUser CurrentUserFor(User user, Space activeSpace) =>
        new() { User = new SimpleAuthUser(user.Id, user.AuthId, activeSpace.Id, user.Name, user.Email, true) };

    private sealed class UnusedIdentityProvider : IIdentityProvider
    {
        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task DeleteAsync(string authId, CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }
}