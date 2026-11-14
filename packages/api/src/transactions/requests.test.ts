import { afterEach, expect, test, vi } from 'vite-plus/test';

import { configureApiClient } from '../client';
import { exportCsv } from './requests';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('the CSV export is downloaded as a file named after its Content-Disposition header', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response('Date;Amount\n2026-11-01;12.50\n', {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': "attachment; filename=export.csv; filename*=UTF-8''transactions-2026-11.csv",
        },
      }),
    ),
  );
  configureApiClient({ baseUrl: 'https://api.example.test', getAuthToken: () => null });

  const download = await exportCsv('space', { year: 2026, month: 11 });

  expect(download.fileName).toBe('transactions-2026-11.csv');
  expect(download.blob).toBeInstanceOf(Blob);
  expect(await download.blob.text()).toBe('Date;Amount\n2026-11-01;12.50\n');
});
