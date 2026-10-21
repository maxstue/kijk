using Kijk.Application.Imports.Shared;
using Microsoft.AspNetCore.DataProtection;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// Encrypts uploaded files with ASP.NET Data Protection. Its key ring lives in Postgres, encrypted with a key from
/// Infisical.
/// </summary>
/// <param name="provider">The data protection provider.</param>
internal sealed class ImportFileProtector(IDataProtectionProvider provider) : IImportFileProtector
{
    private readonly IDataProtector _protector = provider.CreateProtector("Kijk.Imports.File.v1");

    /// <inheritdoc />
    public byte[] Protect(byte[] content) => _protector.Protect(content);

    /// <inheritdoc />
    public byte[] Unprotect(byte[] content) => _protector.Unprotect(content);
}