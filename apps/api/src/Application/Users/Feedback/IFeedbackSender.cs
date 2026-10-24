namespace Kijk.Application.Users.Feedback;

/// <summary>Delivers voluntarily submitted feedback without attaching an account identity.</summary>
public interface IFeedbackSender
{
    /// <summary>Submits feedback independently of optional analytics consent.</summary>
    /// <param name="message">The validated feedback text.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the receiver accepted the submission.</returns>
    Task<bool> SendAsync(string message, CancellationToken cancellationToken);
}