using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Imports.AiDataPreview;
using Kijk.Application.Imports.Cancel;
using Kijk.Application.Imports.Commit;
using Kijk.Application.Imports.ConfirmMapping;
using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Queries;
using Kijk.Application.Imports.Settings;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Imports.Start;
using Kijk.Application.Imports.StartCategorization;
using Kijk.Application.Imports.UpdateCandidate;
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
        var group = builder.MapSpaceGroup("imports")
            .WithTags("Imports")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", List).WithName("Imports.List").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets the latest imports of the active space");
        group.MapGet("/{id:guid}", Details).WithName("Imports.Details").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets an import by id");
        group.MapGet("/{id:guid}/preview", FilePreview).WithName("Imports.FilePreview").RequireSpacePermission(SpacePermissions.Finances.Import).WithSummary("Gets the first rows of an uploaded file for the column mapping");
        group.MapGet("/{id:guid}/candidates", Candidates).WithName("Imports.Candidates").RequireSpacePermission(SpacePermissions.Finances.Import).WithSummary("Gets the rows of an import waiting for review");
        group.MapPost("/", Start).WithName("Imports.Start")
            .RequireSpacePermission(SpacePermissions.Finances.Import)
            .RequireRateLimiting(AppConstants.UploadRateLimit)
            .DisableAntiforgery()
            // Keeps the whole upload in memory, so ASP.NET never writes it to a temporary file.
            .WithMetadata(new RequestSizeLimitAttribute(RequestLimitBytes))
            .WithMetadata(new RequestFormLimitsAttribute { MultipartBodyLengthLimit = RequestLimitBytes, MemoryBufferThreshold = RequestLimitBytes, ValueCountLimit = 10 })
            .WithSummary("Uploads a bank export and starts its import");
        group.MapPost("/{id:guid}/mapping", ConfirmMapping).WithName("Imports.ConfirmMapping").RequireSpacePermission(SpacePermissions.Finances.Import).WithSummary("Confirms the column mapping and starts reading the file");
        group.MapPut("/{id:guid}/candidates/{candidateId:guid}", UpdateCandidate).WithName("Imports.UpdateCandidate").RequireSpacePermission(SpacePermissions.Finances.Import).WithSummary("Changes the category or exclusion of a row during the review");
        group.MapGet("/{id:guid}/ai-preview", AiDataPreview).WithName("Imports.AiDataPreview").RequireSpacePermission(SpacePermissions.Finances.Import).WithSummary("Gets exactly the texts the AI categorization would send");
        group.MapPost("/{id:guid}/categorize", StartCategorization).WithName("Imports.StartCategorization").RequireSpacePermission(SpacePermissions.Finances.Import).WithRequestValidation<CategorizeImportRequest>().WithSummary("Proposes categories with the AI for the rows that have none");
        group.MapPost("/{id:guid}/commit", Commit).WithName("Imports.Commit").RequireSpacePermission(SpacePermissions.Finances.Import).WithSummary("Replaces the account's transactions in the covered months with the reviewed rows");
        group.MapPost("/{id:guid}/cancel", Cancel).WithName("Imports.Cancel").RequireSpacePermission(SpacePermissions.Finances.Import).WithSummary("Cancels an open import and deletes its file");
        group.MapGet("/settings", Settings).WithName("Imports.Settings").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets the import settings of the active space");
        group.MapPut("/settings", UpdateSettings).WithName("Imports.UpdateSettings").RequireSpacePermission(SpacePermissions.Finances.Configure).WithRequestValidation<UpdateImportSettingsRequest>().WithSummary("Changes the import settings of the active space");

        return builder;
    }

    private static async Task<Results<Ok<List<ImportJobResponse>>, ProblemHttpResult>> List(QueriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.ListAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportJobResponse>, ProblemHttpResult>> Details(Guid id, QueriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DetailsAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportPreviewResponse>, ProblemHttpResult>> FilePreview(
        Guid id,
        [FromQuery] string? delimiter,
        [FromQuery] string? encoding,
        [FromQuery] int? headerRowIndex,
        QueriesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.FilePreviewAsync(id, delimiter, encoding, headerRowIndex, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportCandidatePageResponse>, ProblemHttpResult>> Candidates(
        Guid id,
        QueriesHandler handler,
        CancellationToken cancellationToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        [FromQuery] string? months = null,
        [FromQuery] bool cardSettlementsOnly = false)
    {
        var result = await handler.CandidatesAsync(id, page, pageSize, months, cardSettlementsOnly, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<AcceptedAtRoute<ImportJobResponse>, ProblemHttpResult>> Start(
        [FromForm] Guid accountId,
        IFormFile file,
        StartHandler handler,
        CancellationToken cancellationToken)
    {
        await using var content = file.OpenReadStream();
        var result = await handler.HandleAsync(accountId, file.FileName, content, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.AcceptedAtRoute(result.Value, "Imports.Details", new { id = result.Value.Id });
    }

    private static async Task<Results<Accepted<ImportJobResponse>, ProblemHttpResult>> ConfirmMapping(
        Guid id,
        CsvImportMapping mapping,
        ConfirmMappingHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, mapping, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Accepted((string?)null, result.Value);
    }

    private static async Task<Results<Ok<ImportCandidateResponse>, ProblemHttpResult>> UpdateCandidate(
        Guid id,
        Guid candidateId,
        UpdateImportCandidateRequest request,
        UpdateCandidateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, candidateId, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportJobResponse>, ProblemHttpResult>> Commit(
        Guid id,
        CommitImportRequest request,
        CommitHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportJobResponse>, ProblemHttpResult>> Cancel(Guid id, CancelHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<AiPreviewResponse>, ProblemHttpResult>> AiDataPreview(Guid id, AiDataPreviewHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Accepted<ImportJobResponse>, ProblemHttpResult>> StartCategorization(
        Guid id,
        CategorizeImportRequest request,
        StartCategorizationHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Accepted((string?)null, result.Value);
    }

    private static async Task<Results<Ok<ImportSettingsResponse>, ProblemHttpResult>> Settings(SettingsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.ReadAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ImportSettingsResponse>, ProblemHttpResult>> UpdateSettings(
        UpdateImportSettingsRequest request,
        SettingsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}