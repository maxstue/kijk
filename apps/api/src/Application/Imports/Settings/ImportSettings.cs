using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.Settings;

/// <summary>
/// Request for changing the import settings of the active household.
/// </summary>
/// <param name="PurposeRetention">How much of the purpose text imported transactions keep.</param>
public sealed record UpdateImportSettingsRequest(PurposeRetention PurposeRetention);

/// <summary>
/// Validates import settings.
/// </summary>
public sealed class UpdateImportSettingsValidator : AbstractValidator<UpdateImportSettingsRequest>
{
    /// <summary>Creates the validator rules.</summary>
    public UpdateImportSettingsValidator() =>
        RuleFor(request => request.PurposeRetention).IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
}

/// <summary>
/// Reads and changes the import settings of the active household.
/// </summary>
public sealed class ImportSettingsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets the import settings.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The settings, or a not-found error.</returns>
    public async Task<Result<ImportSettingsResponse>> GetAsync(CancellationToken cancellationToken)
    {
        var retention = await dbContext.Households
            .Where(item => item.Id == currentUser.ActiveHouseholdId)
            .Select(item => (PurposeRetention?)item.PurposeRetention)
            .FirstOrDefaultAsync(cancellationToken);

        return retention is null ? Error.NotFound("Active household could not be found") : new ImportSettingsResponse(retention.Value);
    }

    /// <summary>Changes the import settings. Transactions imported earlier keep their purpose as stored.</summary>
    /// <param name="request">The new settings.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The settings, or a not-found error.</returns>
    public async Task<Result<ImportSettingsResponse>> UpdateAsync(UpdateImportSettingsRequest request, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households.FirstOrDefaultAsync(item => item.Id == currentUser.ActiveHouseholdId, cancellationToken);
        if (household is null)
        {
            return Error.NotFound("Active household could not be found");
        }

        household.SetPurposeRetention(request.PurposeRetention);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ImportSettingsResponse(household.PurposeRetention);
    }
}