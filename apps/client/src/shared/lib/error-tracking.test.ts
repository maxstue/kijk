import * as Sentry from '@sentry/react';
import { beforeEach, expect, test, vi } from 'vite-plus/test';

import type { AppRouter } from '@/router';
import { COOKIE_CONSENT_KEY } from '@/shared/types/analytics';

const storage = vi.hoisted(() => ({
  hasItem: vi.fn<(key: string) => boolean>(),
  getItem: vi.fn<(key: string) => unknown>(),
}));
const sdk = vi.hoisted(() => ({
  init: vi.fn<typeof Sentry.init>(),
  captureException: vi.fn<typeof Sentry.captureException>(),
  addIntegration: vi.fn<typeof Sentry.addIntegration>(),
  browserSessionIntegration: vi.fn<typeof Sentry.browserSessionIntegration>(() => ({ name: 'BrowserSession' })),
  tanstackRouterBrowserTracingIntegration: vi.fn<typeof Sentry.tanstackRouterBrowserTracingIntegration>(() => ({
    name: 'router',
  })),
  withStaticSpan: vi.fn<(callback: unknown) => unknown>((callback) => callback),
}));
vi.mock('@kijk/core/lib/browser-storage', () => ({ browserStorage: storage }));
vi.mock('@/shared/config', () => ({ config: { SentryDsn: '', Mode: 'test' } }));
vi.mock('@sentry/react', () => sdk);

let service: (typeof import('./error-tracking'))['ErrorService'];
const router = {} as AppRouter;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  storage.hasItem.mockReturnValue(false);
  service = (await import('./error-tracking')).ErrorService;
});

function initOptions() {
  service.init(router);
  return sdk.init.mock.calls[0]![0]!;
}

test('keeps minimal error reporting enabled but suppresses breadcrumbs and unconsented traces', () => {
  const options = initOptions();
  expect(options.attachStacktrace).toBe(false);
  expect(options.maxBreadcrumbs).toBe(0);
  expect(options.beforeBreadcrumb?.({}, {})).toBeNull();
  expect(options.tracePropagationTargets).toEqual([]);
  expect(options.tracesSampler?.({} as Parameters<NonNullable<typeof options.tracesSampler>>[0])).toBe(0);
  expect(options.beforeSendTransaction?.({ type: 'transaction', transaction: '/home' }, {})).toBeNull();
  expect(sdk.addIntegration).not.toHaveBeenCalled();
  expect(storage.hasItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY);
});

test('filters personal error data independently of optional analytics consent', () => {
  const options = initOptions();
  const result = options.beforeSend?.(
    {
      type: undefined,
      user: { id: 'synthetic-user' },
      message: 'Entered account name',
      exception: { values: [{ type: 'TypeError', value: 'Private input' }] },
    },
    {},
  );
  expect(result).toMatchObject({ exception: { values: [{ type: 'TypeError', value: '[Filtered]' }] } });
  expect(result).not.toHaveProperty('user');
  expect(result).not.toHaveProperty('message');
});

test('enables sanitized router traces only for stored acceptance', () => {
  storage.hasItem.mockReturnValue(true);
  storage.getItem.mockReturnValue('accepted');
  const options = initOptions();
  expect(sdk.tanstackRouterBrowserTracingIntegration).toHaveBeenCalledWith(
    router,
    expect.objectContaining({ traceFetch: false, traceXHR: false, enableHTTPTimings: false }),
  );
  expect(sdk.addIntegration).toHaveBeenCalledOnce();
  expect(options.tracesSampler?.({} as Parameters<NonNullable<typeof options.tracesSampler>>[0])).toBe(0.1);
  expect(
    options.beforeSendTransaction?.(
      { type: 'transaction', transaction: '/resources/$resourceId?name=private', user: { id: 'synthetic-user' } },
      {},
    ),
  ).toMatchObject({ transaction: '/resources/:parameter', user: undefined });
});

test('installs the tracing integration only once after a later acceptance', () => {
  initOptions();
  service.setPerformanceConsent('declined');
  expect(sdk.addIntegration).not.toHaveBeenCalled();
  service.setPerformanceConsent('accepted');
  service.setPerformanceConsent('accepted');
  expect(sdk.addIntegration).toHaveBeenCalledOnce();
});

test('discards an already started transaction when consent is withdrawn', () => {
  storage.hasItem.mockReturnValue(true);
  storage.getItem.mockReturnValue('accepted');
  const options = initOptions();
  storage.getItem.mockReturnValue('declined');
  service.setPerformanceConsent('declined');
  expect(options.tracesSampler?.({} as Parameters<NonNullable<typeof options.tracesSampler>>[0])).toBe(0);
  expect(options.beforeSendTransaction?.({ type: 'transaction', transaction: '/home' }, {})).toBeNull();
});

test('does not install tracing before the router exists', () => {
  service.setPerformanceConsent('accepted');
  expect(sdk.addIntegration).not.toHaveBeenCalled();
  initOptions();
  expect(sdk.addIntegration).not.toHaveBeenCalled();
});

test('forwards technical errors to Sentry', () => {
  const error = new Error('Synthetic failure');
  service.captureException(error);
  expect(sdk.captureException).toHaveBeenCalledWith(error);
});
