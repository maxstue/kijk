import * as Sentry from '@sentry/react';

import { env } from '@/shared/env';

export const createSentry = () =>
  Sentry.init({
    dsn: env.SentryDsn,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.BrowserProfilingIntegration(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // tunneling
    tunnel: `${env.BaseApiUrl}/tunnel`,
    // Performance Monitoring
    tracesSampleRate: 0.3,

    profilesSampleRate: 0.3,

    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\/kijk-api.fly\.dev\/api/, /^https:\/\/kijk-client.vercel\.app/],
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.5, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
