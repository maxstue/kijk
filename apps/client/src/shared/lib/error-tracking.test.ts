import * as Sentry from '@sentry/react';
import { posthog } from 'posthog-js';
import type { PostHog } from 'posthog-js';
import { beforeEach, expect, test, vi } from 'vite-plus/test';

import { config } from '@/shared/config';

const sentry = vi.hoisted(() => ({
  init: vi.fn<typeof Sentry.init>(),
  captureException: vi.fn<typeof Sentry.captureException>(),
}));
const errors = vi.hoisted(() => ({ captureException: vi.fn<PostHog['captureException']>() }));
const posthogSdk = vi.hoisted(() => ({ init: vi.fn<typeof posthog.init>() }));
vi.mock('@/shared/config', () => ({
  config: { Mode: 'test', PosthogKey: 'phc_public', PosthogUrl: 'https://eu.i.posthog.example', SentryDsn: '' },
}));
vi.mock('@sentry/react', () => sentry);
vi.mock('posthog-js', () => ({ posthog: posthogSdk }));

let service: (typeof import('./error-tracking'))['ErrorService'];

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  config.PosthogKey = 'phc_public';
  config.PosthogUrl = 'https://eu.i.posthog.example';
  posthogSdk.init.mockReturnValue(errors as unknown as PostHog);
  service = (await import('./error-tracking')).ErrorService;
});

test('keeps minimal Sentry error reporting without breadcrumbs or tracing', () => {
  service.init();
  const options = sentry.init.mock.calls[0]![0]!;
  const integrations = options.integrations as (defaults: Array<{ name: string }>) => Array<{ name: string }>;
  expect(integrations([{ name: 'BrowserSession' }, { name: 'GlobalHandlers' }])).toEqual([{ name: 'GlobalHandlers' }]);
  expect(options.attachStacktrace).toBe(false);
  expect(options.maxBreadcrumbs).toBe(0);
  expect(options.beforeBreadcrumb?.({}, {})).toBeNull();
  expect(options).not.toHaveProperty('tracesSampler');
  expect(options).not.toHaveProperty('tracePropagationTargets');
});

test('filters personal error data in Sentry independently of optional analytics consent', () => {
  service.init();
  const options = sentry.init.mock.calls[0]![0]!;
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

test('PostHog reports errors from its own anonymous instance that ignores the analytics opt-out', () => {
  service.init();
  const [key, options, name] = posthogSdk.init.mock.calls[0]!;
  expect(key).toBe('phc_public');
  expect(name).toBe('errors');
  expect(options).toMatchObject({
    advanced_disable_flags: true,
    autocapture: false,
    capture_exceptions: { capture_unhandled_errors: true, capture_unhandled_rejections: true },
    capture_pageview: false,
    disable_persistence: true,
    disable_session_recording: true,
    person_profiles: 'never',
  });
  expect(options).not.toHaveProperty('opt_out_capturing_by_default');
  expect(typeof options?.before_send).toBe('function');
});

test.each(['PosthogKey', 'PosthogUrl'] as const)('does not start PostHog error reporting without %s', (field) => {
  config[field] = '';
  service.init();
  expect(posthogSdk.init).not.toHaveBeenCalled();
});

test('forwards technical errors to Sentry and PostHog', () => {
  const error = new Error('Synthetic failure');
  service.init();
  service.captureException(error);
  expect(sentry.captureException).toHaveBeenCalledWith(error);
  expect(errors.captureException).toHaveBeenCalledWith(error);
});

test('still reports to Sentry when PostHog is not configured', () => {
  config.PosthogKey = '';
  const error = new Error('Synthetic failure');
  service.init();
  service.captureException(error);
  expect(sentry.captureException).toHaveBeenCalledWith(error);
  expect(errors.captureException).not.toHaveBeenCalled();
});
