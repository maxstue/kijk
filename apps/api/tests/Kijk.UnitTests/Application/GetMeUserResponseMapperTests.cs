using Kijk.Application.Users.GetMe;
using Kijk.Domain.Entities;

namespace Kijk.UnitTests.Application;

public class GetMeUserResponseMapperTests
{
    [Test]
    public async Task HouseholdResponseUsesHouseholdIdInsteadOfJoinEntityId()
    {
        var householdId = Guid.NewGuid();
        var user = User.Init("test-user", "Test User", "test@example.invalid");
        var membership = new UserHousehold
        {
            User = user,
            HouseholdId = householdId,
            Household = Household.Create("Home"),
            Role = new Role { Name = "Admin", Permissions = [] }
        };
        membership.SetActive(true);
        user.UserHouseholds.Add(membership);

        var response = new[] { user }.AsQueryable().ToResponse().Single();

        await Assert.That(response.Households!.Single().Id).IsEqualTo(householdId);
    }
}