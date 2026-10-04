namespace Kijk.Domain.Authorization;

/// <summary>
/// Defines a household permission with the fixed identifier used for seeding.
/// </summary>
/// <param name="Id">The stable database identifier.</param>
/// <param name="Name">The permission name in the form <c>area:verb</c>.</param>
public sealed record PermissionDefinition(Guid Id, string Name);

/// <summary>
/// The catalog of permissions a household role can grant.
/// Endpoints and handlers check these permissions and never role names.
/// </summary>
public static class HouseholdPermissions
{
    /// <summary>
    /// Permissions for recording and analysing consumptions.
    /// </summary>
    public static class Consumptions
    {
        /// <summary>View consumptions, statistics and years.</summary>
        public const string View = "consumptions:view";

        /// <summary>Record, correct and delete consumptions.</summary>
        public const string Record = "consumptions:record";

        /// <summary>Export consumptions as files.</summary>
        public const string Export = "consumptions:export";
    }

    /// <summary>
    /// Permissions for consumption limits.
    /// </summary>
    public static class Limits
    {
        /// <summary>View consumption limits.</summary>
        public const string View = "limits:view";

        /// <summary>Create and change consumption limits.</summary>
        public const string Plan = "limits:plan";
    }

    /// <summary>
    /// Permissions for transactions, accounts and categories.
    /// </summary>
    public static class Finances
    {
        /// <summary>View transactions, accounts, categories and the budget overview.</summary>
        public const string View = "finances:view";

        /// <summary>Record, correct, categorize and delete transactions.</summary>
        public const string Record = "finances:record";

        /// <summary>Import transactions from bank exports.</summary>
        public const string Import = "finances:import";

        /// <summary>Create, change and delete accounts and custom categories.</summary>
        public const string Configure = "finances:configure";
    }

    /// <summary>
    /// Permissions for budgets.
    /// </summary>
    public static class Budgets
    {
        /// <summary>Create and change budgets.</summary>
        public const string Plan = "budgets:plan";
    }

    /// <summary>
    /// Permissions for household resources.
    /// </summary>
    public static class Resources
    {
        /// <summary>View resources.</summary>
        public const string View = "resources:view";

        /// <summary>Create, change and delete custom resources.</summary>
        public const string Configure = "resources:configure";
    }

    /// <summary>
    /// Permissions for units used by a household.
    /// </summary>
    public static class Units
    {
        /// <summary>Share units with the household or remove a share.</summary>
        public const string Share = "units:share";
    }

    /// <summary>
    /// Permissions for the household itself.
    /// </summary>
    public static class Household
    {
        /// <summary>Change household details and settings.</summary>
        public const string Configure = "household:configure";

        /// <summary>Delete the household with all of its data.</summary>
        public const string Delete = "household:delete";
    }

    /// <summary>
    /// Permissions for household members.
    /// </summary>
    public static class Members
    {
        /// <summary>View household members and their roles.</summary>
        public const string View = "members:view";

        /// <summary>Change the role of other household members.</summary>
        public const string AssignRole = "members:assign-role";
    }

    /// <summary>
    /// Gets all permissions with their fixed identifiers.
    /// </summary>
    public static IReadOnlyList<PermissionDefinition> All { get; } =
    [
        new(new("51af63b7-f581-48a5-8987-937939b56dec"), Consumptions.View),
        new(new("80abd19c-7609-40a6-a296-d4310d3771f0"), Consumptions.Record),
        new(new("4c18ae0c-f592-4398-8226-b89f6150c314"), Consumptions.Export),
        new(new("6a994db4-6fce-4538-bb38-1c8a2edca792"), Limits.View),
        new(new("5ca7bb07-cf8b-4930-8047-e4c857c4fc65"), Limits.Plan),
        new(new("c2d383b8-545f-43d1-b5bb-44a2f184934a"), Resources.View),
        new(new("af500b09-178e-4fd2-8e20-387b84c91fac"), Resources.Configure),
        new(new("57820fa1-c443-458d-b8d3-40ef527720d4"), Units.Share),
        new(new("0e065002-1522-4138-a96b-52e657b7cbcc"), Household.Configure),
        new(new("4ab7acac-5b5f-41b4-a3f7-7174694781b1"), Household.Delete),
        new(new("55d9913b-dcb6-43bc-b9b8-0b840508c795"), Members.View),
        new(new("39e9c646-8685-4fb5-a0d9-68233d3d605c"), Members.AssignRole),
        new(new("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), Finances.View),
        new(new("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), Finances.Record),
        new(new("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), Finances.Import),
        new(new("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a14"), Finances.Configure),
        new(new("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a15"), Budgets.Plan)
    ];
}