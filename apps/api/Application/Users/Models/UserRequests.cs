namespace Kijk.Application.Users.Models;


public record UpdateUserRequest(string? UserName, bool? UseDefaultCategories);

public record WelcomeUserRequest(string? UserName, bool? UseDefaultCategories);