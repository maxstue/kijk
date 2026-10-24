namespace Kijk.Application.Users.Feedback;

/// <summary>Feedback voluntarily submitted to help improve Kijk.</summary>
/// <param name="Message">The feedback text, between 2 and 4000 characters; do not include financial or account details.</param>
public sealed record FeedbackRequest(string Message);