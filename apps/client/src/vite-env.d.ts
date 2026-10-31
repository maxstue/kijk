/// <reference types="vite/client" />

interface ImportMetaEnv {
  // VITE
  DEV: boolean;
  PROD: boolean;
  // Devtools
  VITE_DEVTOOLS_LOGGER: string;
  // Auth
  VITE_CLERK_PUBLISHABLE_KEY: string;
  // Sentry
  VITE_SENTRY_DSN: string;
  // Posthog
  VITE_POSTHOG_KEY: string;
  VITE_POSTHOG_URL: string;
  VITE_POSTHOG_SURVEY_ID: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
