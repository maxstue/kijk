import posthog, { CaptureOptions, Properties } from 'posthog-js';

import { env } from '@/shared/env';

/** AnalyticsService is a wrapper around the Posthog analytics library. */
const AnalyticsService = {
  init: () => {
    if (!env.PosthogKey || !env.PosthogUrl) {
      return;
    }
    posthog.init(env.PosthogKey, {
      api_host: env.PosthogUrl,
      person_profiles: 'identified_only',
      capture_pageview: false,
      autocapture: false,
    });
  },

  getInstance: () => posthog,

  captureEvent: (event_name: string, properties?: Properties | null, options?: CaptureOptions) => {
    posthog.capture(event_name, properties, options);
  },

  identifyUser: (new_distinct_id?: string, userPropertiesToSet?: Properties, userPropertiesToSetOnce?: Properties) => {
    posthog.identify(new_distinct_id, userPropertiesToSet, userPropertiesToSetOnce);
  },
};

export { AnalyticsService };
