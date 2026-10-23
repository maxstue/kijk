import { browserStorage } from '@kijk/core/lib/browser-storage';
import { posthog } from 'posthog-js';
import type { CaptureOptions, Properties } from 'posthog-js';

import { config } from '@/shared/config';
import { getCookieConsent } from '@/shared/lib/cookie-consent';
import { TracingService } from '@/shared/lib/tracing';
import type { CookieConsent } from '@/shared/types/analytics';
import { COOKIE_CONSENT_KEY, LEGACY_CORRELATION_ID_KEY } from '@/shared/types/analytics';

let initialized = false;
let enabled = false;

/** Starts optional analytics only after consent and stops capture immediately when it is withdrawn. */
const AnalyticsService = {
  captureEvent: (event_name: string, properties?: Properties | null, options?: CaptureOptions) => {
    if (enabled) {
      posthog.capture(event_name, properties, options);
    }
  },

  getCookieConsent,

  init: () => {
    browserStorage.removeItem(LEGACY_CORRELATION_ID_KEY);
  },
  setCookieConsent: (consent: CookieConsent) => {
    browserStorage.setItem(COOKIE_CONSENT_KEY, consent);
    TracingService.setConsent(consent);
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
  if (enabled) {
    return;
  }
  if (!initialized) {
    posthog.init(config.PosthogKey!, {
      // Feature switches come from the API. Project settings must never enable extra browser collection.
      advanced_disable_flags: true,
      api_host: config.PosthogUrl,
      autocapture: false,
      capture_exceptions: false,
      capture_performance: false,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      opt_out_capturing_by_default: true,
      opt_out_capturing_persistence_type: 'localStorage',
      persistence: 'memory',
      person_profiles: 'never',
    });
    initialized = true;
  }
  posthog.set_config({ persistence: 'localStorage+cookie' });
  posthog.opt_in_capturing({ captureEventName: false });
  enabled = true;
}

function disableAnalytics() {
  enabled = false;
  if (!initialized) {
    return;
  }
  posthog.opt_out_capturing();
  posthog.set_config({ persistence: 'memory' });
}
