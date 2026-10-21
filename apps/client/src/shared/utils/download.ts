import type { CsvDownload } from '@kijk/api/download';

/** Lets the browser save a downloaded file. */
export function saveDownload(download: CsvDownload) {
  const url = URL.createObjectURL(download.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = download.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
