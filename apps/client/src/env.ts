import { z } from 'zod';

import { logger } from '@/lib/logger';
import { AppError } from '@/types/errors';

const envSchema = z.object({
  // Base
  Mode: z.enum(['development', 'production', 'test']).default('development'),
  // App
  ApiUrl: z.string().url(),
  // Devtools
  DevToolsLogger: z.string().transform((x) => x === 'true'),
  // Auth
  AuthUrl: z.string().trim().min(1),
  AuthKey: z.string().trim().min(1),
  SiteUrl: z.string().trim().min(1),
  // Sentry
  SentryDsn: z.string().optional(),
});

const envParse = envSchema.safeParse({
  Mode: import.meta.env.MODE,
  // App
  ApiUrl: import.meta.env.VITE_API_URL,
  // Devtools
  DevToolsLogger: import.meta.env.VITE_DEVTOOLS_LOGGER,
  // Auth
  AuthUrl: import.meta.env.VITE_SUPABASE_URL,
  AuthKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  SiteUrl: import.meta.env.VITE_SUPABASE_SITE_URL,
  SentryDsn: import.meta.env.VITE_SENTRY_DSN,
});

if (!envParse.success) {
  logger.error({ errors: envParse.error.issues });
  throw new AppError({
    type: 'ENVIRONMENT',
    message: `There is an error with the environment variables. ${envParse.error.issues
      .map((x) => `[${x.path.at(0)}] ${x.code}: ${x.message}`)
      .join('; ')}`,
  });
}

export const env = envParse.data;
