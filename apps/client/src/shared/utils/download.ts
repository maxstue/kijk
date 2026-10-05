import { unwrapApiResponse } from '@/shared/utils/http';

/** A downloaded CSV file. */
export interface CsvDownload {
  blob: Blob;
  fileName: string;
}

/** Turns a blob response into a download named after its Content-Disposition header. */
export function toCsvDownload<TError>(
  result: { data: Blob; error?: never; response: Response } | { data?: never; error: TError; response: Response },
  fallbackFileName: string,
): CsvDownload {
  const blob = unwrapApiResponse(result);
  const disposition = result.response.headers.get('Content-Disposition');
  const encodedFileName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const fileName = encodedFileName
    ? decodeURIComponent(encodedFileName)
    : (disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallbackFileName);

  return { blob, fileName };
}

/** Lets the browser save a downloaded file. */
export function saveDownload(download: CsvDownload) {
  const url = URL.createObjectURL(download.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = download.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
