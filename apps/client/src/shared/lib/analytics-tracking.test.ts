import { posthog } from 'posthog-js';
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';

import { config } from '@/shared/config';
import type { CookieConsent } from '@/shared/types/analytics';
import { COOKIE_CONSENT_KEY, LEGACY_CORRELATION_ID_KEY } from '@/shared/types/analytics';

const storage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => unknown>(),
  hasItem: vi.fn<(key: string) => boolean>(),
  removeItem: vi.fn<(key: string) => void>(),
  setItem: vi.fn<(key: string, value: unknown) => void>(),
}));
const sdk = vi.hoisted(() => ({
  capture: vi.fn<(typeof posthog)['capture']>(),
  init: vi.fn<(typeof posthog)['init']>(),
  opt_in_capturing: vi.fn<(typeof posthog)['opt_in_capturing']>(),
  opt_out_capturing: vi.fn<(typeof posthog)['opt_out_capturing']>(),
  set_config: vi.fn<(typeof posthog)['set_config']>(),
}));
const performanceConsent = vi.hoisted(() => vi.fn<(consent: CookieConsent) => void>());
vi.mock('@kijk/core/lib/browser-storage', () => ({ browserStorage: storage }));
vi.mock('posthog-js', () => ({ posthog: sdk }));
vi.mock('@/shared/config', () => ({
  config: { PosthogKey: 'synthetic-public-key', PosthogUrl: 'https://analytics.example.test' },
}));
vi.mock('@/shared/lib/tracing', () => ({ TracingService: { setConsent: performanceConsent } }));

let AnalyticsService: (typeof import('./analytics-tracking'))['AnalyticsService'];

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  config.PosthogKey = 'synthetic-public-key';
  config.PosthogUrl = 'https://analytics.example.test';
  AnalyticsService = (await import('./analytics-tracking')).AnalyticsService;
});

describe('analytics consent', () => {
  test('does not initialize the SDK before consent, including a declined choice', () => {
    AnalyticsService.init();
    AnalyticsService.setCookieConsent('declined');
    AnalyticsService.setCookieConsent('undecided');
    AnalyticsService.captureEvent('$pageview');
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.capture).not.toHaveBeenCalled();
    expect(sdk.opt_out_capturing).not.toHaveBeenCalled();
  });

  test.each(['PosthogKey', 'PosthogUrl'] as const)('does not initialize without %s', (field) => {
    config[field] = '';
    AnalyticsService.setCookieConsent('accepted');
    expect(sdk.init).not.toHaveBeenCalled();
  });

  test('does not infer consent when no browser choice exists', () => {
    storage.hasItem.mockReturnValue(false);
    expect(AnalyticsService.getCookieConsent()).toBe('undecided');
    expect(storage.getItem).not.toHaveBeenCalled();
  });

  test.each(['accepted', 'declined', 'undecided'] as const)('reads the stored %s choice', (consent) => {
    storage.hasItem.mockReturnValue(true);
    storage.getItem.mockReturnValue(consent);
    expect(AnalyticsService.getCookieConsent()).toBe(consent);
    expect(storage.getItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY);
  });

  test('only enables persistent capture after explicit acceptance', () => {
    AnalyticsService.setCookieConsent('accepted');
    expect(storage.setItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY, 'accepted');
    expect(performanceConsent).toHaveBeenCalledWith('accepted');
    expect(sdk.init).toHaveBeenCalledWith(
      config.PosthogKey,
      expect.objectContaining({
        autocapture: false,
        capture_exceptions: false,
        capture_performance: false,
        capture_heatmaps: false,
        capture_dead_clicks: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        person_profiles: 'never',
        advanced_disable_flags: true,
      }),
    );
    expect(sdk.set_config).toHaveBeenCalledWith({ persistence: 'localStorage+cookie' });
    AnalyticsService.setCookieConsent('accepted');
    expect(sdk.init).toHaveBeenCalledOnce();
    expect(sdk.opt_in_capturing).toHaveBeenCalledOnce();
    expect(sdk.opt_out_capturing).not.toHaveBeenCalled();
  });

  test.each(['declined', 'undecided'] as const)(
    'disables capture for %s, including after previous acceptance',
    (consent) => {
      AnalyticsService.setCookieConsent('accepted');
      vi.clearAllMocks();
      AnalyticsService.setCookieConsent(consent);
      expect(performanceConsent).toHaveBeenCalledWith(consent);
      expect(sdk.opt_out_capturing).toHaveBeenCalledOnce();
      expect(sdk.set_config).toHaveBeenCalledWith({ persistence: 'memory' });
      AnalyticsService.captureEvent('withdrawn');
      expect(sdk.capture).not.toHaveBeenCalled();
      AnalyticsService.setCookieConsent('accepted');
      AnalyticsService.captureEvent('accepted again');
      expect(sdk.init).not.toHaveBeenCalled();
      expect(sdk.capture).toHaveBeenCalledWith('accepted again', undefined, undefined);
    },
  );

  test('stores consent and updates error reporting even when analytics is unconfigured', () => {
    config.PosthogKey = '';
    AnalyticsService.setCookieConsent('declined');
    expect(storage.setItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY, 'declined');
    expect(performanceConsent).toHaveBeenCalledWith('declined');
    expect(sdk.set_config).not.toHaveBeenCalled();
  });

  test('forwards events to the configured SDK', () => {
    AnalyticsService.setCookieConsent('accepted');
    const properties = { view: 'annual' };
    AnalyticsService.captureEvent('view changed', properties, { send_instantly: true });
    expect(sdk.capture).toHaveBeenCalledWith('view changed', properties, { send_instantly: true });
  });

  test('removes the former persistent request id from the browser, even without analytics', () => {
    config.PosthogKey = '';
    AnalyticsService.init();
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_CORRELATION_ID_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
