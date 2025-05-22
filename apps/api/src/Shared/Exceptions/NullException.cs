namespace Kijk.Shared.Exceptions;

/// <summary>
/// Exception thrown when a null value is passed to a method that does not accept it.
/// </summary>
/// <param name="message"> The exception message. </param>
public class NullException(string message) : Exception(message);