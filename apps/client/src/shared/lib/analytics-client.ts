import { posthog } from 'posthog-js';
import type { CaptureOptions, PostHogConfig, Properties } from 'posthog-js';

import type { CookieConsent } from '@/shared/types/app';
import { env } from '@/shared/env';
import { browserStorage } from '@/shared/lib/browser-storage';
import { COOKIE_CONSENT_KEY } from '@/shared/types/app';

/** AnalyticsService is a wrapper around the Posthog analytics library. */
const AnalyticsClient = {
  init: () => {
    if (!env.PosthogKey || !env.PosthogUrl) {
      return;
    }
    posthog.init(env.PosthogKey, {
      api_host: env.PosthogUrl,
      person_profiles: 'identified_only',
      persistence: AnalyticsClient.getCookieConsent() === 'yes' ? 'localStorage+cookie' : 'memory',
    });
  },

  getInstance: () => posthog,

  captureEvent: (event_name: string, properties?: Properties | null, options?: CaptureOptions) => {
    posthog.capture(event_name, properties, options);
  },

  options: () =>
    ({
      api_host: env.PosthogUrl,
      person_profiles: 'identified_only',
      capture_pageview: false,
      autocapture: false,
    }) satisfies Partial<PostHogConfig>,

  identifyUser: (new_distinct_id?: string, userPropertiesToSet?: Properties, userPropertiesToSetOnce?: Properties) => {
    posthog.identify(new_distinct_id, userPropertiesToSet, userPropertiesToSetOnce);
  },

  getCookieConsent() {
    if (browserStorage.hasItem(COOKIE_CONSENT_KEY)) {
      return browserStorage.getItem<CookieConsent>(COOKIE_CONSENT_KEY)!;
    }
    return 'undecided';
  },
  setCookieConsent: (consent: CookieConsent) => {
    browserStorage.setItem(COOKIE_CONSENT_KEY, consent);
    if (consent === 'yes') {
      AnalyticsClient.getInstance().opt_in_capturing();
      AnalyticsClient.getInstance().set_config({ capture_pageview: true, autocapture: true });
    }
    if (consent === 'no' || consent === 'undecided') {
      AnalyticsClient.getInstance().opt_out_capturing();
    }
  },
};

export { AnalyticsClient as AnalyticsService };
