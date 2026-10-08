using System.Globalization;
using Kijk.Application.Shared.Csv;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Transactions.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;
using nietras.SeparatedValues;

namespace Kijk.Application.Transactions.Export;

/// <summary>
/// A generated transaction CSV file.
/// </summary>
/// <param name="Content">The UTF-8 encoded CSV content.</param>
/// <param name="FileName">The suggested download file name.</param>
public sealed record TransactionCsvExport(byte[] Content, string FileName);

/// <summary>
/// Exports the transactions of the active space as CSV, with the same filters as the transaction list.
/// </summary>
public sealed class ExportTransactionsHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>Exports transactions, oldest first.</summary>
    /// <param name="filter">The period and category filters.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The CSV file, or a validation error for an invalid filter.</returns>
    public async Task<Result<TransactionCsvExport>> ExportAsync(TransactionFilter filter, CancellationToken cancellationToken)
    {
        if (filter.Validate() is { } error)
        {
            return error;
        }

        var query = filter.Apply(dbContext.GetVisibleTransactions(currentUser)
            .Include(transaction => transaction.Account)
            .Include(transaction => transaction.Category)
            .Where(transaction => transaction.SpaceId == currentUser.ActiveSpaceId));

        var transactions = await query
            .OrderBy(transaction => transaction.BookingDate)
            .ThenBy(transaction => transaction.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var period = filter.Year switch
        {
            null => "all",
            { } year when filter.Month is null => $"{year:D4}",
            { } year => $"{year:D4}-{filter.Month:D2}"
        };
        var suffix = filter.Uncategorized is true ? "-uncategorized" : string.Empty;
        // The UTC creation time keeps repeated exports of the same filter apart.
        var createdAt = timeProvider.GetUtcNow().ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);
        return new TransactionCsvExport(TransactionCsvWriter.Write(transactions), $"transactions-{period}{suffix}-{createdAt}.csv");
    }
}

/// <summary>
/// Serializes transactions to the public CSV export format. Amounts use a dot as decimal separator and a minus sign
/// for expenses; free text is protected against formula injection.
/// </summary>
public static class TransactionCsvWriter
{
    /// <summary>Serializes transactions with their loaded account and category.</summary>
    /// <param name="transactions">The transactions.</param>
    /// <returns>The encoded CSV content.</returns>
    public static byte[] Write(IEnumerable<Transaction> transactions)
    {
        var writer = Sep.New(',').Writer(options => options with { Escape = true }).ToText();
        writer.Header.Add("Date", "Account", "Counterparty", "Purpose", "Amount", "Currency", "Category", "CategorySource", "Status", "IsTransfer");

        foreach (var transaction in transactions)
        {
            using var row = writer.NewRow();
            row["Date"].Set(transaction.BookingDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            row["Account"].Set(CsvFiles.SanitizeText(transaction.Account?.Name));
            row["Counterparty"].Set(CsvFiles.SanitizeText(transaction.Counterparty));
            row["Purpose"].Set(CsvFiles.SanitizeText(transaction.Purpose));
            row["Amount"].Set(transaction.Amount.ToString("0.00", CultureInfo.InvariantCulture));
            row["Currency"].Set(transaction.Currency);
            row["Category"].Set(CsvFiles.SanitizeText(transaction.Category?.Name));
            row["CategorySource"].Set(transaction.CategorySource?.ToString() ?? string.Empty);
            row["Status"].Set(transaction.Status.ToString());
            row["IsTransfer"].Set(transaction.IsTransfer ? "true" : "false");
        }

        writer.Dispose();
        return CsvFiles.Encode(writer.ToString());
    }
}