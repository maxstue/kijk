import { afterEach, expect, test, vi } from 'vite-plus/test';

import { configureApiClient } from '../client';
import { record, update } from './requests';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test.each(
  ['Europe/Berlin', 'America/Los_Angeles', 'UTC'].flatMap((timezone) =>
    ['2026-01-01', '2026-04-01', '2026-11-01'].map((date) => ({ timezone, date })),
  ),
)('recording and updating preserve $date in $timezone', async ({ timezone, date }) => {
  vi.stubEnv('TZ', timezone);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(Response.json({ id: 'reading' }))),
  );
  configureApiClient({ baseUrl: 'https://api.example.test', getAuthToken: () => null });
  const [year, month, day] = date.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);

  await record('space', {
    date: selectedDate,
    name: 'Meter reading',
    resourceId: 'resource',
    value: 100,
  });
  await update('space', 'reading', { date: selectedDate });

  for (const [request] of vi.mocked(fetch).mock.calls as Array<[Request]>) {
    expect(await request.json()).toMatchObject({ date: `${date}T00:00:00.000Z` });
  }
});

test('a name-only update does not send replacement values for the reading type or meter segment', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ id: 'reading' })));
  configureApiClient({ baseUrl: 'https://api.example.test', getAuthToken: () => null });

  await update('space', 'reading', { name: 'Renamed reading' });

  const [request] = vi.mocked(fetch).mock.calls[0] as [Request];
  expect(await request.json()).toEqual({
    name: 'Renamed reading',
    date: null,
    value: null,
    resourceId: null,
    valueType: null,
    startsNewMeterSegment: null,
  });
});

test('an explicit false meter segment and relative reading type are preserved', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ id: 'reading' })));
  configureApiClient({ baseUrl: 'https://api.example.test', getAuthToken: () => null });

  await update('space', 'reading', { valueType: 'Relative', startsNewMeterSegment: false });

  const [request] = vi.mocked(fetch).mock.calls[0] as [Request];
  expect(await request.json()).toMatchObject({ valueType: 'Relative', startsNewMeterSegment: false });
});
