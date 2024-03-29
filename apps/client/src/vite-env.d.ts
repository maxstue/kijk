/// <reference types="vite/client" />

interface ImportMetaEnv {
  // VITE
  DEV: boolean;
  PROD: boolean;
  // Base
  VITE_BASE_API_URL: string;
  VITE_API_URL: string;
  // Devtools
  VITE_DEVTOOLS_LOGGER: string;
  // Auth
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_SITE_URL: string;
  // Sentry
  VITE_SENTRY_DSN: string;
  VITE_SENTRY_ENABLE_TELEMETRY: string;
  VITE_SENTRY_ENABLE: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const SHORT_APP_VERSION: string;
declare const LONG_APP_VERSION: string;
