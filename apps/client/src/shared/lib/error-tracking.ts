import { browserStorage } from '@kijk/core/lib/browser-storage';
import * as Sentry from '@sentry/react';

import type { AppRouter } from '@/router';
import { config } from '@/shared/config';
import { scrubErrorEvent, scrubPerformanceSpan, scrubPerformanceTransaction } from '@/shared/lib/error-event-scrubber';
import type { CookieConsent } from '@/shared/types/analytics';
import { COOKIE_CONSENT_KEY } from '@/shared/types/analytics';

const performanceSampleRate = 0.1;

interface ErrorTrackingService {
  captureException(error: unknown): void;
  init(router: AppRouter): void;
  setPerformanceConsent(consent: CookieConsent): void;
}

class SentryErrorTrackingService implements ErrorTrackingService {
  private router?: AppRouter;
  private routerTracingInstalled = false;

  captureException(error: unknown) {
    Sentry.captureException(error);
  }

  init(router: AppRouter) {
    this.router = router;
    Sentry.init({
      dsn: config.SentryDsn,
      environment: config.Mode,
      integrations: [],
      maxBreadcrumbs: 0,
      beforeBreadcrumb: () => null,
      beforeSend: scrubErrorEvent,
      beforeSendSpan: scrubPerformanceSpan,
      beforeSendTransaction: (event) => (hasPerformanceConsent() ? scrubPerformanceTransaction(event) : null),
      sendDefaultPii: false,
      tracePropagationTargets: [],
      tracesSampler: () => (hasPerformanceConsent() ? performanceSampleRate : 0),
    });

    this.enableRouterTracing(getPerformanceConsent());
  }

  setPerformanceConsent(consent: CookieConsent) {
    this.enableRouterTracing(consent);
  }

  private enableRouterTracing(consent: CookieConsent) {
    if (consent !== 'accepted' || this.routerTracingInstalled || !this.router) return;

    Sentry.addIntegration(
      Sentry.tanstackRouterBrowserTracingIntegration(this.router, {
        enableHTTPTimings: false,
        enableInp: false,
        enableLongAnimationFrame: false,
        enableLongTask: false,
        instrumentNavigation: true,
        instrumentPageLoad: true,
        linkPreviousTrace: 'off',
        traceFetch: false,
        traceXHR: false,
      }),
    );
    this.routerTracingInstalled = true;
  }
}

function getPerformanceConsent() {
  return browserStorage.hasItem(COOKIE_CONSENT_KEY)
    ? browserStorage.getItem<CookieConsent>(COOKIE_CONSENT_KEY)!
    : 'undecided';
}

function hasPerformanceConsent() {
  return getPerformanceConsent() === 'accepted';
}

/** Provider-neutral entry point for privacy-preserving error and performance reporting. */
const ErrorService = new SentryErrorTrackingService();

export { ErrorService };
