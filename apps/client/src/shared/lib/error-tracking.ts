import * as Sentry from '@sentry/react';

import { env } from '@/shared/env';

export const createSentry = () =>
  Sentry.init({
    dsn: env.SentryDsn,
    environment: env.Mode,
    integrations: [new Sentry.BrowserTracing(), new Sentry.Replay(), new Sentry.BrowserProfilingIntegration()],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\/kijk-api.fly\.dev\/api/, /^https:\/\/kijk-client.vercel\.app/],
    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
