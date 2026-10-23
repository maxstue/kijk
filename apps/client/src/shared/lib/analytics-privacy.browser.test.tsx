import { HttpResponse, http } from 'msw';
import { posthog } from 'posthog-js';
import { expect, test, vi } from 'vite-plus/test';

import { config } from '@/shared/config';
import { worker } from '@/test/mocks/browser';

import { AnalyticsService } from './analytics-tracking';

vi.mock('./tracing', () => ({ TracingService: { setConsent: () => {} } }));

test('the real analytics SDK sends nothing before consent or after withdrawal', async () => {
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
  AnalyticsService.init();
  AnalyticsService.setCookieConsent('declined');
  AnalyticsService.captureEvent('before-consent', null, { send_instantly: true });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(requests).toEqual([]);

  AnalyticsService.setCookieConsent('accepted');
  // PostHog normally drops HeadlessChrome events as bot traffic; allow them only in this test.
  posthog.set_config({ opt_out_useragent_filter: true });
  AnalyticsService.captureEvent('accepted', null, { send_instantly: true });
  await expect.poll(() => captures.length).toBeGreaterThan(0);
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
});
