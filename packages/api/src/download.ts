/** A downloaded CSV file. */
export interface CsvDownload {
  blob: Blob;
  fileName: string;
}

/**
 * Turns the full result of a blob request (`throwOnError: false`) into a download named after its Content-Disposition
 * header. Failed responses never reach it: the API client raises them as `ApiError`.
 */
export function toCsvDownload(
  result: { data: unknown; headers: { get: (name: string) => string | null } },
  fallbackFileName: string,
): CsvDownload {
  if (!(result.data instanceof Blob)) {
    throw new TypeError('The API returned no file.');
  }

  const disposition = result.headers.get('Content-Disposition');
  const encodedFileName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const fileName = encodedFileName
    ? decodeURIComponent(encodedFileName)
    : (disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallbackFileName);

  return { blob: result.data, fileName };
}
