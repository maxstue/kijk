// Load the real SDK extension locally so error reporting needs no remote script in this test.
import 'posthog-js/dist/exception-autocapture.js';
import { HttpResponse, http } from 'msw';
import { posthog } from 'posthog-js';
import { expect, test, vi } from 'vite-plus/test';

import { config } from '@/shared/config';
import { worker } from '@/test/mocks/browser';

import { AnalyticsService } from './analytics-tracking';
import { ErrorService } from './error-tracking';

vi.mock('./tracing', () => ({ TracingService: { setConsent: () => {} } }));
vi.mock('@sentry/react', () => ({ init: () => {}, captureException: () => {} }));

test('real analytics respects consent while error reporting stays active after withdrawal and reinitialization', async () => {
  config.PosthogKey = 'phc_privacy_test';
  config.PosthogUrl = `${location.origin}/telemetry`;
  const requests: string[] = [];
  const captures: string[] = [];
  worker.use(
    http.all(`${location.origin}/telemetry/*`, ({ request }) => {
      requests.push(request.url);
      if (request.method === 'POST') {
        captures.push(request.url);
      }
      return HttpResponse.json({ status: 1 });
    }),
  );
  const init = vi.spyOn(posthog, 'init');
  ErrorService.init();
  const errors = init.mock.results[0]!.value!;
  const errorOptions = init.mock.calls[0]![1]!;
  init.mockRestore();
  // PostHog normally drops HeadlessChrome events as bot traffic; allow them only in this test.
  errors.set_config({ opt_out_useragent_filter: true, request_batching: false });
  AnalyticsService.init();
  AnalyticsService.setCookieConsent('declined');
  AnalyticsService.captureEvent('before-consent', null, { send_instantly: true });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(requests).toEqual([]);

  ErrorService.captureException(new Error('before consent'));
  await expect.poll(() => captures.length).toBe(1);

  AnalyticsService.setCookieConsent('accepted');
  posthog.set_config({ opt_out_useragent_filter: true });
  AnalyticsService.captureEvent('accepted', null, { send_instantly: true });
  await expect.poll(() => captures.length).toBe(2);
  for (const key of [
    'autocapture',
    'capture_exceptions',
    'capture_performance',
    'capture_heatmaps',
    'capture_dead_clicks',
    'capture_pageview',
    'capture_pageleave',
  ] as const) {
    expect(posthog.config[key]).toBe(false);
  }
  expect(posthog.config.disable_session_recording).toBe(true);
  expect(posthog.config.disable_surveys).toBe(true);

  AnalyticsService.setCookieConsent('declined');
  await new Promise((resolve) => setTimeout(resolve, 100));
  const count = requests.length;
  AnalyticsService.captureEvent('after-withdrawal', null, { send_instantly: true });
  posthog.capture('direct-after-withdrawal', null, { send_instantly: true });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(requests).toHaveLength(count);

  ErrorService.captureException(new Error('after withdrawal'));
  await expect.poll(() => captures.length).toBe(count + 1);
  expect(posthog.has_opted_out_capturing()).toBe(true);

  // A fresh SDK instance must also ignore the analytics opt-out persisted in browser storage.
  const reinitializedErrors = posthog.init(
    config.PosthogKey!,
    { ...errorOptions, opt_out_useragent_filter: true, request_batching: false },
    'errors-reinitialized',
  )!;
  reinitializedErrors.captureException(new Error('after reinitialization'));
  await expect.poll(() => captures.length).toBe(count + 2);
  expect(posthog.has_opted_out_capturing()).toBe(true);
});
