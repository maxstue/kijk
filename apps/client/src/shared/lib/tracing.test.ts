import { beforeEach, expect, test, vi } from 'vite-plus/test';

import type { AppRouter } from '@/router';
import { COOKIE_CONSENT_KEY } from '@/shared/types/analytics';

const storage = vi.hoisted(() => ({
  hasItem: vi.fn<(key: string) => boolean>(),
  getItem: vi.fn<(key: string) => unknown>(),
}));
const provider = vi.hoisted(() => ({ startTracing: vi.fn<(options: unknown) => unknown>() }));
vi.mock('@kijk/core/lib/browser-storage', () => ({ browserStorage: storage }));
vi.mock('@/shared/config', () => ({
  config: {
    Mode: 'test',
    PosthogKey: 'phc_public',
    PosthogUrl: 'https://eu.i.posthog.example',
    SentryDsn: 'https://key@o1.ingest.de.sentry.io/2',
    Version: '1.0.0',
  },
}));
vi.mock('./tracing-provider', () => provider);

let service: (typeof import('./tracing'))['TracingService'];
const router = {} as AppRouter;
const flush = () => new Promise((resolve) => setTimeout(resolve));

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  storage.hasItem.mockReturnValue(false);
  service = (await import('./tracing')).TracingService;
});

test('does not load or start tracing without an accepted choice', async () => {
  service.init(router);
  service.setConsent('declined');
  service.setConsent('undecided');
  await flush();
  expect(provider.startTracing).not.toHaveBeenCalled();
  expect(storage.hasItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY);
});

test('starts tracing for a stored acceptance with both destinations', async () => {
  storage.hasItem.mockReturnValue(true);
  storage.getItem.mockReturnValue('accepted');
  service.init(router);
  await flush();
  expect(provider.startTracing).toHaveBeenCalledOnce();
  expect(provider.startTracing).toHaveBeenCalledWith(
    expect.objectContaining({
      posthog: { key: 'phc_public', url: 'https://eu.i.posthog.example' },
      router,
      sentryDsn: 'https://key@o1.ingest.de.sentry.io/2',
    }),
  );
});

test('starts tracing only once after a later acceptance', async () => {
  service.init(router);
  service.setConsent('accepted');
  service.setConsent('accepted');
  await flush();
  expect(provider.startTracing).toHaveBeenCalledOnce();
});

test('consent is read at span time, so withdrawing it stops tracing', async () => {
  storage.hasItem.mockReturnValue(true);
  storage.getItem.mockReturnValue('accepted');
  service.init(router);
  await flush();
  const { hasConsent } = provider.startTracing.mock.calls[0]![0] as { hasConsent: () => boolean };
  expect(hasConsent()).toBe(true);
  storage.getItem.mockReturnValue('declined');
  expect(hasConsent()).toBe(false);
});

test('does not start before the router exists', async () => {
  service.setConsent('accepted');
  await flush();
  expect(provider.startTracing).not.toHaveBeenCalled();
});

test('withdrawal closes the old session permanently and acceptance starts a fresh one', async () => {
  const stop = vi.fn<() => Promise<void>>().mockResolvedValue();
  provider.startTracing.mockReturnValue(stop);
  storage.hasItem.mockReturnValue(true);
  storage.getItem.mockReturnValue('accepted');
  service.init(router);
  await flush();
  const first = provider.startTracing.mock.calls[0]![0] as { hasConsent: () => boolean };

  service.setConsent('declined');
  expect(first.hasConsent()).toBe(false);
  expect(stop).toHaveBeenCalledOnce();
  service.setConsent('accepted');
  await flush();
  const second = provider.startTracing.mock.calls[1]![0] as { hasConsent: () => boolean };
  expect(second.hasConsent()).toBe(true);
  expect(first.hasConsent()).toBe(false);
});

test('withdrawal before the lazy import resolves does not start a stale session', async () => {
  service.init(router);
  service.setConsent('accepted');
  service.setConsent('declined');
  await flush();
  expect(provider.startTracing).not.toHaveBeenCalled();
});

test('a failing tracing download never breaks the app', async () => {
  provider.startTracing.mockImplementation(() => {
    throw new Error('boom');
  });
  service.init(router);
  service.setConsent('accepted');
  await expect(flush()).resolves.toBeUndefined();
});
