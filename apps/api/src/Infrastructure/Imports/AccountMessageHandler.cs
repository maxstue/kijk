using Kijk.Application.Users.Delete;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// Wolverine handler for account messages. It only delegates to <see cref="AccountEraser" />.
/// </summary>
public static class AccountMessageHandler
{
    /// <summary>Deletes an account and all its data.</summary>
    /// <param name="message">The message.</param>
    /// <param name="eraser">The account eraser.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the account is deleted.</returns>
    public static Task Handle(DeleteUserAccount message, AccountEraser eraser, CancellationToken cancellationToken) =>
        eraser.EraseAsync(message, cancellationToken);
}