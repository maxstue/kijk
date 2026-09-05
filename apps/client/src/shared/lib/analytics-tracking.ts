import { browserStorage } from '@kijk/core/lib/browser-storage';
import { posthog } from 'posthog-js';
import type { CaptureOptions, PostHogConfig, Properties } from 'posthog-js';

import { config } from '@/shared/config';
import { ErrorService } from '@/shared/lib/error-tracking';
import type { CookieConsent } from '@/shared/types/analytics';
import { COOKIE_CONSENT_KEY } from '@/shared/types/analytics';

/** AnalyticsService is a wrapper around the Posthog analytics library. */
const AnalyticsService = {
  captureEvent: (event_name: string, properties?: Properties | null, options?: CaptureOptions) => {
    posthog.capture(event_name, properties, options);
  },

  getCookieConsent() {
    if (browserStorage.hasItem(COOKIE_CONSENT_KEY)) {
      return browserStorage.getItem<CookieConsent>(COOKIE_CONSENT_KEY)!;
    }
    return 'undecided';
  },

  getInstance: () => posthog,

  identifyUser: (new_distinct_id: string, userPropertiesToSet?: Properties, userPropertiesToSetOnce?: Properties) => {
    posthog.identify(new_distinct_id, userPropertiesToSet, userPropertiesToSetOnce);
  },

  init: () => {
    if (!config.PosthogKey || !config.PosthogUrl) {
      return;
    }
    posthog.init(config.PosthogKey, {
      api_host: config.PosthogUrl,
      autocapture: false,
      capture_pageview: false,
      opt_out_capturing_by_default: true,
      persistence: 'memory',
      person_profiles: 'identified_only',
    });
    posthog.opt_out_capturing();
  },

  options: () =>
    ({
      api_host: config.PosthogUrl,
      autocapture: false,
      capture_pageview: false,
      opt_out_capturing_by_default: true,
      persistence: 'memory',
      person_profiles: 'identified_only',
    }) satisfies Partial<PostHogConfig>,
  setCookieConsent: (consent: CookieConsent) => {
    browserStorage.setItem(COOKIE_CONSENT_KEY, consent);
    ErrorService.setPerformanceConsent(consent);
    if (!config.PosthogKey || !config.PosthogUrl) {
      return;
    }
    if (consent === 'accepted') {
      enableAnalytics();
      return;
    }
    disableAnalytics();
  },
};

export { AnalyticsService };

function enableAnalytics() {
  AnalyticsService.getInstance().set_config({
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage+cookie',
  });
  AnalyticsService.getInstance().opt_in_capturing();
}

function disableAnalytics() {
  AnalyticsService.getInstance().opt_out_capturing();
  AnalyticsService.getInstance().set_config({
    autocapture: false,
    capture_pageview: false,
    persistence: 'memory',
  });
}
