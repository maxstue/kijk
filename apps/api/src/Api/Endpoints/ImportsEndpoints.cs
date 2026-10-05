using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Imports.AiPreview;
using Kijk.Application.Imports.Cancel;
using Kijk.Application.Imports.Categorize;
using Kijk.Application.Imports.Commit;
using Kijk.Application.Imports.ConfirmMapping;
using Kijk.Application.Imports.Create;
using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Get;
using Kijk.Application.Imports.Review;
using Kijk.Application.Imports.Settings;
using Kijk.Application.Imports.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for CSV imports of bank exports.
/// </summary>
public sealed class ImportsEndpoints : IEndpointGroup
{
    // A little above the file limit, for the multipart envelope and the account field.
    private const int RequestLimitBytes = ImportLimits.MaxFileBytes + 64 * 1024;

    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("imports")
            .WithTags("Imports")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Gets the latest imports of the active household");
        group.MapGet("/{id:guid}", GetById).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithName("GetImportById").WithSummary("Gets an import by id");
        group.MapGet("/{id:guid}/preview", GetPreview).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Gets the first rows of an uploaded file for the column mapping");
        group.MapGet("/{id:guid}/candidates", GetCandidates).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Gets the rows of an import waiting for review");
        group.MapPost("/", Create)
            .RequireHouseholdPermission(HouseholdPermissions.Finances.Import)
            .RequireRateLimiting(AppConstants.UploadRateLimit)
            .DisableAntiforgery()
            // Keeps the whole upload in memory, so ASP.NET never writes it to a temporary file.
            .WithMetadata(new RequestSizeLimitAttribute(RequestLimitBytes))
            .WithMetadata(new RequestFormLimitsAttribute { MultipartBodyLengthLimit = RequestLimitBytes, MemoryBufferThreshold = RequestLimitBytes, ValueCountLimit = 10 })
            .WithSummary("Uploads a bank export and starts its import");
        group.MapPost("/{id:guid}/mapping", ConfirmMapping).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Confirms the column mapping and starts reading the file");
        group.MapPut("/{id:guid}/candidates/{candidateId:guid}", UpdateCandidate).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Changes the category or exclusion of a row during the review");
        group.MapGet("/{id:guid}/ai-preview", GetAiPreview).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Gets exactly the texts the AI categorization would send");
        group.MapPut("/{id:guid}/ai-preview/{key}", UpdateAiPreviewItem).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Deselects or selects a text of the AI preview");
        group.MapPost("/{id:guid}/categorize", Categorize).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithRequestValidation<CategorizeImportRequest>().WithSummary("Proposes categories with the AI for the rows that have none");
        group.MapPost("/{id:guid}/commit", Commit).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Replaces the account's transactions in the covered months with the reviewed rows");
        group.MapPost("/{id:guid}/cancel", Cancel).RequireHouseholdPermission(HouseholdPermissions.Finances.Import).WithSummary("Cancels an open import and deletes its file");
        group.MapGet("/settings", GetSettings).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Gets the import settings of the active household");
        group.MapPut("/settings", UpdateSettings).RequireHouseholdPermission(HouseholdPermissions.Finances.Configure).WithRequestValidation<UpdateImportSettingsRequest>().WithSummary("Changes the import settings of the active household");

        return builder;
    }

    private static async Task<Results<Ok<List<ImportJobResponse>>, ProblemHttpResult>> GetAll(GetImportsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportJobResponse>, ProblemHttpResult>> GetById(Guid id, GetImportsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetByIdAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportPreviewResponse>, ProblemHttpResult>> GetPreview(
        Guid id,
        [FromQuery] string? delimiter,
        [FromQuery] string? encoding,
        [FromQuery] int? headerRowIndex,
        GetImportsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.GetPreviewAsync(id, delimiter, encoding, headerRowIndex, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<ImportCandidateResponse>>, ProblemHttpResult>> GetCandidates(Guid id, GetImportsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetCandidatesAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<AcceptedAtRoute<ImportJobResponse>, ProblemHttpResult>> Create(
        [FromForm] Guid accountId,
        IFormFile file,
        CreateImportHandler handler,
        CancellationToken cancellationToken)
    {
        await using var content = file.OpenReadStream();
        var result = await handler.CreateAsync(accountId, file.FileName, content, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.AcceptedAtRoute(result.Value, "GetImportById", new { id = result.Value.Id });
    }

    private static async Task<Results<Accepted<ImportJobResponse>, ProblemHttpResult>> ConfirmMapping(
        Guid id,
        CsvImportMapping mapping,
        ConfirmImportMappingHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.ConfirmAsync(id, mapping, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Accepted((string?)null, result.Value);
    }

    private static async Task<Results<Ok<ImportCandidateResponse>, ProblemHttpResult>> UpdateCandidate(
        Guid id,
        Guid candidateId,
        UpdateImportCandidateRequest request,
        UpdateImportCandidateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, candidateId, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportJobResponse>, ProblemHttpResult>> Commit(
        Guid id,
        CommitImportRequest request,
        CommitImportHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CommitAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportJobResponse>, ProblemHttpResult>> Cancel(Guid id, CancelImportHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.CancelAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AiPreviewResponse>, ProblemHttpResult>> GetAiPreview(Guid id, ImportAiPreviewHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AiPreviewItemResponse>, ProblemHttpResult>> UpdateAiPreviewItem(
        Guid id,
        string key,
        UpdateAiPreviewItemRequest request,
        ImportAiPreviewHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, key, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Accepted<ImportJobResponse>, ProblemHttpResult>> Categorize(
        Guid id,
        CategorizeImportRequest request,
        CategorizeImportHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CategorizeAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Accepted((string?)null, result.Value);
    }

    private static async Task<Results<Ok<ImportSettingsResponse>, ProblemHttpResult>> GetSettings(ImportSettingsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportSettingsResponse>, ProblemHttpResult>> UpdateSettings(
        UpdateImportSettingsRequest request,
        ImportSettingsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}