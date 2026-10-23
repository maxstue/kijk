import type { AppRouter } from '@/router';
import { config } from '@/shared/config';
import { getCookieConsent } from '@/shared/lib/cookie-consent';
import type { CookieConsent } from '@/shared/types/analytics';

function hasConsent() {
  return getCookieConsent() === 'accepted';
}

/**
 * Starts OpenTelemetry tracing of the router once the user has accepted performance tracing. The tracing code is loaded
 * only then, so users who decline never download it. Withdrawing consent stops new traces and discards queued ones.
 */
class TracingService {
  private router?: AppRouter;
  private session?: { active: boolean; stop?: () => Promise<void> };

  init(router: AppRouter) {
    this.router = router;
    this.setConsent(getCookieConsent());
  }

  setConsent(consent: CookieConsent) {
    if (consent !== 'accepted') {
      const previous = this.session;
      this.session = undefined;
      if (previous) {
        // Invalidate before shutdown flushes its queue; later acceptance must never revive this session.
        previous.active = false;
        void previous.stop?.().catch(() => undefined);
      }
      return;
    }
    this.start();
  }

  private start() {
    if (this.session || !this.router) {
      return;
    }
    const session: NonNullable<TracingService['session']> = { active: true };
    this.session = session;
    const router = this.router;

    // Telemetry must never break the app: a failed download is not retried.
    void import('./tracing-provider')
      .then(({ startTracing }) => {
        if (!session.active) {
          return;
        }
        session.stop = startTracing({
          environment: config.Mode,
          hasConsent: () => session.active && hasConsent(),
          posthog:
            config.PosthogKey && config.PosthogUrl ? { key: config.PosthogKey, url: config.PosthogUrl } : undefined,
          router,
          sentryDsn: config.SentryDsn,
          version: config.Version,
        });
      })
      .catch(() => undefined);
  }
}

/** Entry point for privacy-preserving performance tracing. */
const TracingServiceInstance = new TracingService();

export { TracingServiceInstance as TracingService };
