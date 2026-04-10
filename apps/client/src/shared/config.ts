import { logger } from '@kijk/core/lib/logger';
import { z } from 'zod';

import { AppError } from '@/shared/types/errors';

const envSchema = z.object({
  // Base
  Mode: z.enum(['development', 'production', 'test']).default('development'),
  // App
  BaseApiUrl: z.url(),
  ApiUrl: z.url(),
  WebUrl: z.url(),
  Version: z.string(),
  // Devtools
  DevToolsLogger: z.string().transform((x) => x === 'true'),
  // Auth
  AuthPublishableKey: z.string().trim().min(1),
  // Sentry
  SentryDsn: z.string().optional(),
  // Posthog
  PosthogKey: z.string().optional(),
  PosthogUrl: z.string().optional(),
  PosthogSurveyId: z.string().optional(),
});

const envParse = envSchema.safeParse({
  Mode: import.meta.env.MODE,
  // App
  BaseApiUrl: import.meta.env.VITE_BASE_API_URL,
  ApiUrl: import.meta.env.VITE_API_URL,
  WebUrl: import.meta.env.VITE_WEB_URL,
  Version: import.meta.env.VITE_APP_VERSION,
  // Devtools
  DevToolsLogger: import.meta.env.VITE_DEVTOOLS_LOGGER,
  // Auth
  AuthPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  SentryDsn: import.meta.env.VITE_SENTRY_DSN,
  // Posthog
  PosthogKey: import.meta.env.VITE_POSTHOG_KEY,
  PosthogUrl: import.meta.env.VITE_POSTHOG_URL,
  PosthogSurveyId: import.meta.env.VITE_POSTHOG_SURVEY_ID,
});

if (!envParse.success) {
  logger.error('env invalid', { errors: envParse.error.issues });
  throw new AppError({
    type: 'ENVIRONMENT',
    message: `There is an error with the environment variables. ${envParse.error.issues
      .map((x) => `[${x.path.at(0)?.toString()}]: ${x.code}: ${x.message}`)
      .join('; ')}`,
  });
}

/**
 * A config object that contains the environment variables of the application. It is initialized at the start of the
 * application and can be imported and used in any part of the application. The environment variables are validated
 * using Zod and if there is an error, an AppError is thrown with the details of the error.
 */
export const config = envParse.data;
