using System.Globalization;
using Kijk.Application.Shared.Csv;
using Kijk.Application.Shared.Persistence;
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
/// Exports the transactions of the active household as CSV, with the same filters as the transaction list.
/// </summary>
public sealed class ExportTransactionsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Exports transactions, oldest first.</summary>
    /// <param name="year">The year, or <see langword="null" /> for all years.</param>
    /// <param name="month">The month (1-12), or <see langword="null" /> for the whole year. Requires a year.</param>
    /// <param name="uncategorized">When <see langword="true" />, only transactions without a category.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The CSV file, or a validation error for an invalid period.</returns>
    public async Task<Result<TransactionCsvExport>> ExportAsync(int? year, int? month, bool? uncategorized, CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9999 || month is < 1 or > 12 || month is not null && year is null)
        {
            return Error.Validation("Year or month is invalid");
        }

        var query = dbContext.Transactions
            .Include(transaction => transaction.Account)
            .Include(transaction => transaction.Category)
            .Where(transaction => transaction.HouseholdId == currentUser.ActiveHouseholdId);

        if (year is { } selectedYear)
        {
            var start = new DateTime(selectedYear, month ?? 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = month is null ? start.AddYears(1) : start.AddMonths(1);
            query = query.Where(transaction => transaction.BookingDate >= start && transaction.BookingDate < end);
        }

        if (uncategorized is true)
        {
            query = query.Where(transaction => transaction.CategoryId == null);
        }

        var transactions = await query
            .OrderBy(transaction => transaction.BookingDate)
            .ThenBy(transaction => transaction.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var period = year switch
        {
            null => "all",
            _ when month is null => $"{year:D4}",
            _ => $"{year:D4}-{month:D2}"
        };
        var suffix = uncategorized is true ? "-uncategorized" : string.Empty;
        return new TransactionCsvExport(TransactionCsvWriter.Write(transactions), $"transactions-{period}{suffix}.csv");
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