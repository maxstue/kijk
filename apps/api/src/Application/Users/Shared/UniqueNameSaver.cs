using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Users.Shared;

/// <summary>
/// Saves changes to a user whose unique name (<c>Max#4821</c>) may collide with another user's. The unique index on
/// name and number decides; on a collision the user gets a random free number and the save is retried. Checking first
/// and saving afterwards would collide when two users are created at the same time.
/// </summary>
public sealed class UniqueNameSaver(IAppDbContext dbContext)
{
    private const int MaxAttempts = 5;

    /// <summary>Saves all tracked changes and assigns a free number while the user's unique name is taken.</summary>
    /// <param name="user">The tracked user whose name or number may collide.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="null" /> on success, or a conflict when every number of the name is taken.</returns>
    /// <exception cref="DbUpdateException">The save failed for another reason than a taken unique name.</exception>
    public async Task<Error?> SaveAsync(User user, CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                return null;
            }
            catch (DbUpdateException) when (attempt < MaxAttempts)
            {
                if (!await IsTakenAsync(user, cancellationToken))
                {
                    throw;
                }

                var tag = await FreeTagAsync(user, cancellationToken);
                if (tag is null)
                {
                    return Error.Conflict("Every number of this name is taken. Please choose another name.");
                }

                user.AssignTag(tag.Value);
            }
        }

        // The last attempt rethrows instead of returning, so this point is unreachable.
        throw new InvalidOperationException("The unique name could not be saved.");
    }

    private Task<bool> IsTakenAsync(User user, CancellationToken cancellationToken) =>
        // The column collation compares names ignoring case, like the unique index.
        dbContext.Users.AsNoTracking().AnyAsync(other => other.Id != user.Id && other.Name == user.Name && other.Tag == user.Tag, cancellationToken);

    private async Task<int?> FreeTagAsync(User user, CancellationToken cancellationToken)
    {
        var taken = (await dbContext.Users
            .AsNoTracking()
            .Where(other => other.Id != user.Id && other.Name == user.Name)
            .Select(other => other.Tag)
            .ToListAsync(cancellationToken)).ToHashSet();

        var free = Enumerable.Range(User.MinTag, User.MaxTag - User.MinTag + 1).Where(tag => !taken.Contains(tag)).ToArray();
        return free.Length == 0 ? null : free[Random.Shared.Next(free.Length)];
    }
}