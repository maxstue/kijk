import { afterEach, expect, test, vi } from 'vite-plus/test';

import { configureApiClient } from '../client';
import { update } from './requests';

afterEach(() => vi.unstubAllGlobals());

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
