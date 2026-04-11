import { browserStorage } from '@kijk/core/lib/browser-storage';
import { posthog } from 'posthog-js';
import type { CaptureOptions, PostHogConfig, Properties } from 'posthog-js';

import { config } from '@/shared/config';
import type { CookieConsent } from '@/shared/types/app';
import { COOKIE_CONSENT_KEY } from '@/shared/types/app';

/** AnalyticsService is a wrapper around the Posthog analytics library. */
const AnalyticsClient = {
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

  identifyUser: (new_distinct_id?: string, userPropertiesToSet?: Properties, userPropertiesToSetOnce?: Properties) => {
    posthog.identify(new_distinct_id, userPropertiesToSet, userPropertiesToSetOnce);
  },

  init: () => {
    if (!config.PosthogKey || !config.PosthogUrl) {
      return;
    }
    posthog.init(config.PosthogKey, {
      api_host: config.PosthogUrl,
      persistence: AnalyticsClient.getCookieConsent() === 'accepted' ? 'localStorage+cookie' : 'memory',
      person_profiles: 'identified_only',
    });
  },

  options: () =>
    ({
      api_host: config.PosthogUrl,
      autocapture: false,
      capture_pageview: false,
      person_profiles: 'identified_only',
    }) satisfies Partial<PostHogConfig>,
  setCookieConsent: (consent: CookieConsent) => {
    browserStorage.setItem(COOKIE_CONSENT_KEY, consent);
    if (consent === 'accepted') {
      AnalyticsClient.getInstance().opt_in_capturing();
      AnalyticsClient.getInstance().set_config({ autocapture: true, capture_pageview: true });
    }
    if (consent === 'declined' || consent === 'undecided') {
      AnalyticsClient.getInstance().opt_out_capturing();
    }
  },
};

export { AnalyticsClient as AnalyticsService };
