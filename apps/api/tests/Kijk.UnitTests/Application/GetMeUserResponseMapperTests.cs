using Kijk.Application.Users.Me;
using Kijk.Domain.Entities;

namespace Kijk.UnitTests.Application;

public class GetMeUserResponseMapperTests
{
    [Test]
    public async Task SpaceResponseUsesSpaceIdInsteadOfJoinEntityId()
    {
        var spaceId = Guid.NewGuid();
        var user = User.Init("test-user", "Test User", "test@example.invalid");
        var membership = new UserSpace
        {
            User = user,
            SpaceId = spaceId,
            Space = Space.Create("Home"),
            Role = new Role { Name = "Admin", Permissions = [] }
        };
        membership.SetDefault(true);
        user.UserSpaces.Add(membership);

        var response = new[] { user }.AsQueryable().ToResponse().Single();

        await Assert.That(response.Spaces!.Single().Id).IsEqualTo(spaceId);
        await Assert.That(response.Spaces!.Single().IsDefault).IsTrue();
    }
}