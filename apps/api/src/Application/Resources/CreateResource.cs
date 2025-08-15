using Kijk.Application.Resources.Shared;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Resources;

/// <summary>
/// Command to create a new resource type.
/// </summary>
/// <param name="Name"></param>
/// <param name="Color"></param>
/// <param name="Unit"></param>
public record CreateResourceRequest(string Name, string Color, string Unit);

public class CreateResourceRequestValidator : AbstractValidator<CreateResourceRequest>
{
    public CreateResourceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 4 and 30 characters long");

        RuleFor(x => x.Color)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must be set")
            .Must(x => x.StartsWith('#')).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must start with a '#'");

        RuleFor(x => x.Unit)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Unit' must be set")
            .Length(2, 10).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Unit' must be between 2 and 10 characters long");
    }
}

/// <summary>
/// Handler to create a new resource.
/// </summary>
public static class CreateResourceHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateResourceHandler));

    public static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> HandleAsync(CreateResourceRequest command,
        IValidator<CreateResourceRequest> validator, AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        // TODO move validator into Endpointfilter
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .Select(x => Error.Validation(description: $"{x.ErrorCode} - {x.ErrorMessage}"))
                .ToList();
            Logger.Error("Validation failed with errors: {Errors}", errors);
            return TypedResults.Problem(Error.Validation(errors[0].Description).ToProblemDetails());
        }

        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Error("User with id {Id} could not be found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound($"User with id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        if (user.Resources.Any(c => string.Equals(c.Name, command.Name, StringComparison.OrdinalIgnoreCase)))
        {
            Logger.Error("Resource with name {Name} already exists", command.Name);
            return TypedResults.Problem(
                Error.Validation($"A resource with the name '{command.Name}' already exists").ToProblemDetails());
        }

        var newResource = new Resource
        {
            Name = command.Name,
            Unit = command.Unit,
            Color = command.Color,
            CreatorType = CreatorType.User
        };

        user.AddResource(newResource);

        var resEntity = await dbContext.AddAsync(newResource, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new ResourceResponse(resEntity.Entity.Id, resEntity.Entity.Name, resEntity.Entity.Color, resEntity.Entity.Unit,
            resEntity.Entity.CreatorType));
    }
}