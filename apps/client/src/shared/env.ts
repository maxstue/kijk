import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { AppError } from '@/shared/types/errors';

const envSchema = z.object({
  // Base
  Mode: z.enum(['development', 'production', 'test']).default('development'),
  // App
  BaseApiUrl: z.string().url(),
  ApiUrl: z.string().url(),
  WebUrl: z.string().url(),
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
      .map((x) => `[${x.path.at(0)}] ${x.code}: ${x.message}`)
      .join('; ')}`,
  });
}

export const env = envParse.data;
