using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Imports.Settings;

/// <summary>
/// Request for changing the import settings of the active space.
/// </summary>
/// <param name="PurposeRetention">How much of the purpose text imported transactions keep.</param>
/// <param name="AiDataSharing">Which transaction data the AI categorization may see; unchanged when omitted.</param>
/// <param name="MinimizeData">Whether imports store neither names of private persons nor counterparty keys; unchanged when omitted.</param>
public sealed record UpdateImportSettingsRequest(PurposeRetention PurposeRetention, AiDataSharing? AiDataSharing = null, bool? MinimizeData = null);

/// <summary>
/// Validates import settings.
/// </summary>
public sealed class UpdateImportSettingsValidator : AbstractValidator<UpdateImportSettingsRequest>
{
    /// <summary>Creates the validator rules.</summary>
    public UpdateImportSettingsValidator()
    {
        RuleFor(request => request.PurposeRetention).IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.AiDataSharing).IsInEnum().When(request => request.AiDataSharing is not null).WithErrorCode(ErrorCodes.ValidationError);
    }
}

/// <summary>
/// Reads and changes import settings in the active space or an explicitly authorized space.
/// </summary>
public sealed class ImportSettingsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets the import settings.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <param name="spaceId">The settings space; defaults to the active space.</param>
    /// <returns>The settings, or a not-found error.</returns>
    public async Task<Result<ImportSettingsResponse>> GetAsync(CancellationToken cancellationToken, Guid? spaceId = null)
    {
        if (spaceId is { } id && await dbContext.AuthorizeSpaceAsync(currentUser.Id, id, SpacePermissions.Finances.View, cancellationToken) is { } error)
        {
            return error;
        }

        var settings = await dbContext.Spaces
            .Where(item => item.Id == (spaceId ?? currentUser.ActiveSpaceId))
            .Select(item => new ImportSettingsResponse(item.PurposeRetention, item.AiDataSharing, item.MinimizeData))
            .FirstOrDefaultAsync(cancellationToken);

        return settings is null ? Error.NotFound("Space could not be found") : settings;
    }

    /// <summary>Changes the import settings. Transactions imported earlier keep their purpose as stored.</summary>
    /// <param name="request">The new settings.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <param name="spaceId">The settings space; defaults to the active space.</param>
    /// <returns>The settings, or a not-found error.</returns>
    public async Task<Result<ImportSettingsResponse>> UpdateAsync(UpdateImportSettingsRequest request, CancellationToken cancellationToken, Guid? spaceId = null)
    {
        if (spaceId is { } id && await dbContext.AuthorizeSpaceAsync(currentUser.Id, id, SpacePermissions.Finances.Configure, cancellationToken) is { } error)
        {
            return error;
        }

        var space = await dbContext.Spaces.FirstOrDefaultAsync(item => item.Id == (spaceId ?? currentUser.ActiveSpaceId), cancellationToken);
        if (space is null)
        {
            return Error.NotFound("Space could not be found");
        }

        space.SetPurposeRetention(request.PurposeRetention);
        if (request.AiDataSharing is { } sharing)
        {
            space.SetAiDataSharing(sharing);
        }

        if (request.MinimizeData is { } minimize)
        {
            space.SetMinimizeData(minimize);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new ImportSettingsResponse(space.PurposeRetention, space.AiDataSharing, space.MinimizeData);
    }
}