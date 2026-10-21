import { posthog } from 'posthog-js';
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';

import { config } from '@/shared/config';
import type { CookieConsent } from '@/shared/types/analytics';
import { COOKIE_CONSENT_KEY, LEGACY_CORRELATION_ID_KEY } from '@/shared/types/analytics';

import { AnalyticsService } from './analytics-tracking';

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
vi.mock('@/shared/lib/error-tracking', () => ({ ErrorService: { setPerformanceConsent: performanceConsent } }));

beforeEach(() => {
  vi.clearAllMocks();
  config.PosthogKey = 'synthetic-public-key';
  config.PosthogUrl = 'https://analytics.example.test';
});

describe('analytics consent', () => {
  test('starts with capture disabled and memory-only persistence', () => {
    AnalyticsService.init();
    expect(sdk.init).toHaveBeenCalledWith(config.PosthogKey, {
      api_host: config.PosthogUrl,
      autocapture: false,
      capture_pageview: false,
      opt_out_capturing_by_default: true,
      persistence: 'memory',
      person_profiles: 'identified_only',
    });
    expect(sdk.opt_out_capturing).toHaveBeenCalledOnce();
    expect(sdk.opt_in_capturing).not.toHaveBeenCalled();
    expect(AnalyticsService.options()).toEqual(sdk.init.mock.calls[0]?.[1]);
  });

  test.each(['PosthogKey', 'PosthogUrl'] as const)('does not initialize without %s', (field) => {
    config[field] = '';
    AnalyticsService.init();
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
    expect(sdk.set_config).toHaveBeenCalledWith({
      autocapture: true,
      capture_pageview: true,
      persistence: 'localStorage+cookie',
    });
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
      expect(sdk.set_config).toHaveBeenCalledWith({
        autocapture: false,
        capture_pageview: false,
        persistence: 'memory',
      });
      expect(sdk.opt_in_capturing).not.toHaveBeenCalled();
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
    const properties = { view: 'annual' };
    AnalyticsService.captureEvent('view changed', properties, { send_instantly: true });
    expect(sdk.capture).toHaveBeenCalledWith('view changed', properties, { send_instantly: true });
    expect(AnalyticsService.getInstance()).toBe(posthog);
  });

  test('removes the former persistent request id from the browser, even without analytics', () => {
    config.PosthogKey = '';
    AnalyticsService.init();
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_CORRELATION_ID_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
